import type { ChatMessage, ChatSession } from '../domain/chat';

export type SendChatMessagePayload = {
  message: string;
  task?: string;
  session_id?: string;
};

export type ChatMessageResponseData = {
  session_id: string;
  message: ChatMessage;
};

export type ChatErrorPayload = {
  message: string;
};

export type ChatStreamEventName = 'meta' | 'chunk' | 'done' | 'error';

export type ChatStreamMetaPayload = {
  session_id?: string;
  cached?: boolean;
  guarded?: boolean;
};

export type ChatStreamChunkPayload = {
  chunk: string;
};

export type ChatStreamDonePayload = {
  session_id: string;
  message: ChatMessage;
};

export type ChatStreamEventPayloadByName = {
  meta: ChatStreamMetaPayload;
  chunk: ChatStreamChunkPayload;
  done: ChatStreamDonePayload;
  error: ChatErrorPayload;
};

export type ChatSessionView = ChatSession & {
  active?: boolean;
};

export type ChatMessageView = ChatMessage & {
  isPending?: boolean;
  isError?: boolean;
};

export type ApiSpecialEndpointData = {
  '/user': import('../domain/user').User;
  '/auth/login': { user: import('../domain/user').User; token?: string };
  '/reports/dashboard': import('../dashboard').DashboardStats;
};
