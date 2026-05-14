// src/types/chat.types.ts
// Public types cho module Chat — import từ '@/types'

import type { ChatTask } from '@/utils/chatPrompt';
import type { ChatMessage, ChatSession } from './domain/chat';
import type {
  ChatStreamChunkEvent,
  ChatStreamErrorEvent,
  ChatStreamMetaEvent,
} from './api/chat';

// --- Payload gửi lên API ---
export interface SendChatMessagePayload {
  // Nội dung tin nhắn — dùng content (chuẩn) hoặc message (legacy compat)
  content?: string;
  message?: string;
  task?: ChatTask;
  session_id?: string;
  context?: Record<string, unknown>;
  model?: string;
}

export interface ChatResultSource {
  id?: string | number;
  article_id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  category?: string;
  content?: string;
  body?: string;
  content_preview?: string;
  snippet?: string;
  score?: number;
}

// --- Kết quả trả về từ API (non-stream) ---
export interface SendChatMessageResult {
  session_id?: string;
  session?: ChatSession;
  message?: ChatMessage;
  response_text?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  sources?: ChatResultSource[];
  citations?: ChatResultSource[];
  knowledge_refs?: ChatResultSource[];
  references?: ChatResultSource[];
}

// --- Handlers cho stream mode ---
// Public vì caller (component/hook) cần truyền vào sendMessageStream()
export interface ChatStreamHandlers {
  onMeta?: (meta: ChatStreamMetaEvent) => void;
  onChunk?: (chunk: ChatStreamChunkEvent) => void;
  onDone?: (done: SendChatMessageResult) => void;
  onError?: (error: ChatStreamErrorEvent) => void;
}
