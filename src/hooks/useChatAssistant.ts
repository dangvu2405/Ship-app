import { useCallback, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import chatService from '@/services/chat.service';
import type { ChatTask } from '@/utils/chatPrompt';
import { getErrorMessage, getErrorStatus } from '@/utils/errorHandler';
import {
  extractChatSources,
  getFirstString,
  normalizeText,
  sleep,
  toStringId,
  type ChatSource,
} from '@/components/common/chat/chatUtils';
import type { ChatMessageView } from '@/components/common/chat/ChatMessageList';

const DEFAULT_MODEL = 'gemini-2.0-flash';

interface UseChatAssistantOptions {
  model?: string;
  task?: ChatTask;
  contextJson?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  toast: any;
}

export function useChatAssistant({
  model = DEFAULT_MODEL,
  task = 'chat',
  contextJson = '',
  onSuccess,
  onError,
  toast,
}: UseChatAssistantOptions) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (sending) return;

    // Create new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const nowIso = new Date().toISOString();
    const optimisticUserId = `tmp-user-${Date.now()}`;
    const optimisticAssistantId = `tmp-assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: optimisticUserId, role: 'user', content, createdAt: nowIso },
      {
        id: optimisticAssistantId,
        role: 'assistant',
        content: t('notificationCenter.chat.waitingResponse'),
        createdAt: nowIso,
        model: model.trim() || DEFAULT_MODEL,
        isPending: true,
      },
    ]);

    setSending(true);

    let context: Record<string, unknown> | undefined;
    if (contextJson?.trim()) {
      try {
        const parsed = JSON.parse(contextJson);
        context = parsed;
      } catch {
        // Fallback or ignore
      }
    }

    try {
      let donePayload;
      let lastError: unknown;
      let hadAnyStreamChunk = false;
      let streamSessionId = '';
      let streamMeta: { cached?: boolean; guarded?: boolean } = {};
      let finalAssistantText = '';
      let finalAssistantModel = '';
      let finalSources: ChatSource[] | undefined;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        let attemptHadChunk = false;
        try {
          donePayload = await chatService.sendMessageStream(
            {
              message: content,
              session_id: sessionId || undefined,
              task,
              context,
              model: model.trim() || DEFAULT_MODEL,
            },
            {
              onMeta: (meta) => {
                streamSessionId = toStringId(meta.session_id) || streamSessionId;
                streamMeta = { cached: meta.cached, guarded: meta.guarded };
              },
              onChunk: (chunk) => {
                const chunkText = chunk.text ?? chunk.chunk;
                if (!chunkText) return;
                attemptHadChunk = true;
                hadAnyStreamChunk = true;
                setMessages((prev) =>
                  prev.map((item) =>
                    item.id === optimisticAssistantId
                      ? {
                          ...item,
                          content:
                            item.content === t('notificationCenter.chat.waitingResponse')
                              ? chunkText
                              : `${item.content}${chunkText}`,
                          isPending: true,
                          isError: false,
                        }
                      : item
                  )
                );
              },
              onDone: (done) => {
                streamSessionId =
                  toStringId(done.session_id ?? done.session?.session_id ?? done.session?.id) ||
                  streamSessionId;
                streamMeta = { cached: done.cached, guarded: done.guarded };
                const resolvedText = normalizeText(done.response_text ?? done.message?.response ?? '');
                if (resolvedText) finalAssistantText = resolvedText;
                const resolvedModel =
                  getFirstString(done.message, ['model']) || getFirstString(done, ['model']);
                if (resolvedModel) finalAssistantModel = resolvedModel;
                const src = extractChatSources(done);
                if (src?.length) finalSources = src;
              },
              onError: (streamError) => {
                throw new Error(streamError.message || t('notificationCenter.chat.sendError'));
              },
            },
            abortControllerRef.current?.signal
          );

          if (!donePayload && !attemptHadChunk) {
            const fallbackResponse = await chatService.sendMessage({
              message: content,
              task,
              context,
              model: model.trim() || DEFAULT_MODEL,
            });
            if (!fallbackResponse.success)
              throw new Error(fallbackResponse.message || t('notificationCenter.chat.sendError'));
            donePayload = fallbackResponse.data;
            streamSessionId =
              toStringId(donePayload?.session_id ?? donePayload?.session?.session_id ?? donePayload?.session?.id) ||
              streamSessionId;
            streamMeta = { cached: donePayload?.cached, guarded: donePayload?.guarded };
            const resolvedText = normalizeText(
              donePayload?.response_text ?? donePayload?.message?.response ?? ''
            );
            if (resolvedText) finalAssistantText = resolvedText;
            const resolvedModel =
              getFirstString(donePayload?.message, ['model']) || getFirstString(donePayload, ['model']);
            if (resolvedModel) finalAssistantModel = resolvedModel;
            const srcFb = extractChatSources(donePayload);
            if (srcFb?.length) finalSources = srcFb;
          }

          if (!donePayload && attemptHadChunk) {
            donePayload = {
              session_id: streamSessionId || undefined,
              cached: streamMeta.cached,
              guarded: streamMeta.guarded,
            };
          }
          lastError = undefined;
          break;
        } catch (error: any) {
          if (error.name === 'AbortError') return;
          lastError = error;
          if (attempt === 0 && !attemptHadChunk) {
            toast.info(t('notificationCenter.chat.retrying'));
            await sleep(700);
            continue;
          }
          throw error;
        }
      }

      if (abortControllerRef.current?.signal.aborted) return;

      if (!donePayload && lastError) throw lastError;
      if (!donePayload && !hadAnyStreamChunk) throw new Error(t('notificationCenter.chat.sendError'));

      if (streamSessionId) setSessionId(streamSessionId);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticAssistantId
            ? {
                ...item,
                content: finalAssistantText || item.content,
                model: finalAssistantModel || item.model,
                cached: streamMeta.cached ?? item.cached,
                guarded: streamMeta.guarded ?? item.guarded,
                isPending: false,
                isError: false,
                sources: finalSources ?? item.sources,
              }
            : item
        )
      );
      
      onSuccess?.();
    } catch (error) {
      if ((error as any).name === 'AbortError') return;
      
      const status = getErrorStatus(error);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticAssistantId
            ? {
                ...item,
                isPending: false,
                isError: true,
                content:
                  item.content === t('notificationCenter.chat.waitingResponse')
                    ? t('notificationCenter.chat.sendError')
                    : item.content,
              }
            : item
        )
      );
      
      if (status === 429) toast.error(t('notificationCenter.chat.rateLimited'));
      else toast.error(getErrorMessage(error) || t('notificationCenter.chat.sendError'));
      
      onError?.(error);
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, model, task, contextJson, t, toast, sending, onSuccess, onError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    setMessages,
    sending,
    sendMessage,
    sessionId,
    setSessionId,
    clearMessages,
  };
}
