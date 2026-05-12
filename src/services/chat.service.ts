import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, ChatMessage, ChatSession } from '@/types';
import type { ChatTask } from '@/utils/chatPrompt';
import {
  normalizeChatMessages,
  normalizeChatSessions,
  normalizeSendMessageDonePayload,
  normalizeSendMessagePayload,
} from '@/utils/chatResponse';
import { getTenantId } from '@/lib/auth-session';
import { buildApiUrl } from '@/config/env';

export interface SendChatMessagePayload {
  content?: string;
  message?: string;
  task?: ChatTask;
  session_id?: string;
  context?: Record<string, unknown>;
  model?: string;
}

export interface SendChatMessageResult {
  session_id?: string;
  session?: ChatSession;
  message?: ChatMessage;
  response_text?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
}

interface StreamMetaEvent {
  session_id?: string;
  cached?: boolean;
  guarded?: boolean;
}

interface StreamChunkEvent {
  index?: number;
  text?: string;
}

type StreamDoneEvent = SendChatMessageResult;

interface StreamErrorEvent {
  message?: string;
  [key: string]: unknown;
}

interface StreamHandlers {
  onMeta?: (meta: StreamMetaEvent) => void;
  onChunk?: (chunk: StreamChunkEvent) => void;
  onDone?: (done: StreamDoneEvent) => void;
  onError?: (error: StreamErrorEvent) => void;
}

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

  async sendMessageStream(payload: SendChatMessagePayload, handlers: StreamHandlers = {}, signal?: AbortSignal): Promise<StreamDoneEvent | undefined> {
    const tenantId = getTenantId();
    const response = await fetch(buildApiUrl(ENDPOINTS.chat.messagesStream), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(tenantId ? { 'X-Tenant-ID': String(tenantId) } : {}),
      },
      body: JSON.stringify(this.toApiPayload(payload)),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
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
        handlers.onMeta?.(data as StreamMetaEvent);
      } else if (name === 'chunk' && typeof data === 'object' && data !== null) {
        handlers.onChunk?.(data as StreamChunkEvent);
      } else if (name === 'done' && typeof data === 'object' && data !== null) {
        const normalizedDone = normalizeSendMessageDonePayload(data);
        donePayload = normalizedDone;
        handlers.onDone?.(normalizedDone);
      } else if (name === 'error' && typeof data === 'object' && data !== null) {
        handlers.onError?.(data as StreamErrorEvent);
        throw new Error((data as StreamErrorEvent).message || 'Chat stream error');
      }
    };

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';

      for (const rawEvent of events) {
        processRawEvent(rawEvent);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processRawEvent(buffer);
    }

    return donePayload;
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(ENDPOINTS.chat.sessionById(sessionId));
    return response.data;
  }
}

export default new ChatService();
