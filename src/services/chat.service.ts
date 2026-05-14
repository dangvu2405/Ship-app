import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, ChatMessage, ChatSession } from '@/types';
import type {
  ChatStreamChunkEvent,
  ChatStreamErrorEvent,
  ChatStreamHandlers,
  ChatStreamMetaEvent,
  SendChatMessagePayload,
  SendChatMessageResult,
} from '@/types';
import {
  normalizeChatMessages,
  normalizeChatSessions,
  normalizeSendMessageDonePayload,
  normalizeSendMessagePayload,
} from '@/utils/chatResponse';
import { getAuthToken, getTenantId } from '@/lib/auth-session';
import { buildApiUrl } from '@/config/env';
import { refreshAuthSession } from '@/lib/axios';

// Internal types — chỉ dùng trong file này, không export ra ngoài
// Dùng "type" thay vì "interface" để báo hiệu đây là nội bộ
type StreamDoneEvent = SendChatMessageResult;

class ChatService {
  private toApiPayload(payload: SendChatMessagePayload) {
    return {
      ...payload,
      content: payload.content ?? payload.message ?? '',
    };
  }

  async getSessions(limit = 20): Promise<ApiResponse<ChatSession[]>> {
    const response = await api.get(ENDPOINTS.chat.sessions, {
      params: { limit },
    });
    return {
      ...response.data,
      data: normalizeChatSessions(response.data?.data),
    };
  }

  async getMessages(sessionId: string, limit = 30): Promise<ApiResponse<ChatMessage[]>> {
    const response = await api.get(ENDPOINTS.chat.messages, {
      params: { session_id: sessionId, limit },
    });
    return {
      ...response.data,
      data: normalizeChatMessages(response.data?.data),
    };
  }

  async sendMessage(payload: SendChatMessagePayload): Promise<ApiResponse<SendChatMessageResult>> {
    const response = await api.post(ENDPOINTS.chat.messages, this.toApiPayload(payload));
    return {
      ...response.data,
      data: normalizeSendMessagePayload(response.data?.data),
    };
  }

  async sendMessageStream(payload: SendChatMessagePayload, handlers: ChatStreamHandlers = {}, signal?: AbortSignal): Promise<StreamDoneEvent | undefined> {
    // 90-second timeout for the initial connection; the stream itself can run longer.
    const timeoutSignal = AbortSignal.timeout(90_000);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const requestStream = () => {
      const tenantId = getTenantId();
      const token = getAuthToken();

      return fetch(buildApiUrl(ENDPOINTS.chat.messagesStream), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { 'X-Tenant-ID': String(tenantId) } : {}),
        },
        body: JSON.stringify(this.toApiPayload(payload)),
        signal: combinedSignal,
      });
    };

    let response = await requestStream();
    if (response.status === 401 && await refreshAuthSession()) {
      response = await requestStream();
    }

    if (!response.ok || !response.body) {
      const text = await response.text();
      let message = text || `HTTP ${response.status}`;
      try {
        const data = JSON.parse(text) as { message?: string };
        message = data.message || message;
      } catch {
        // Keep the raw response text when the backend did not return JSON.
      }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let donePayload: StreamDoneEvent | undefined;

    const processRawEvent = (rawEvent: string) => {
      const normalizedRawEvent = rawEvent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = normalizedRawEvent.split('\n');

      let name = '';
      const dataLines: string[] = [];

      for (const line of lines) {
        if (!line || line.startsWith(':')) continue;
        if (line.startsWith('event:')) {
          name = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice('data:'.length).trimStart());
        }
      }

      if (!name || dataLines.length === 0) return;

      let data: unknown;
      try {
        data = JSON.parse(dataLines.join('\n')) as unknown;
      } catch {
        return;
      }

      if (name === 'meta' && typeof data === 'object' && data !== null) {
        handlers.onMeta?.(data as ChatStreamMetaEvent);
      } else if (name === 'chunk' && typeof data === 'object' && data !== null) {
        handlers.onChunk?.(data as ChatStreamChunkEvent);
      } else if (name === 'done' && typeof data === 'object' && data !== null) {
        const normalizedDone = normalizeSendMessageDonePayload(data);
        donePayload = normalizedDone;
        handlers.onDone?.(normalizedDone);
      } else if (name === 'error' && typeof data === 'object' && data !== null) {
        handlers.onError?.(data as ChatStreamErrorEvent);
        throw new Error((data as ChatStreamErrorEvent).message || 'Chat stream error');
      }
    };

    try {
      for (;;) {
        if (signal?.aborted) break;
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          processRawEvent(rawEvent);
        }
      }

      if (!signal?.aborted) {
        buffer += decoder.decode();
        if (buffer.trim()) processRawEvent(buffer);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return undefined;
      throw err;
    } finally {
      reader.releaseLock();
    }

    return donePayload;
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(ENDPOINTS.chat.sessionById(sessionId));
    return response.data;
  }
}

export default new ChatService();
