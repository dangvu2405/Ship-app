import type { ChatMessage, ChatSession, User } from './entities';
import type { DashboardStats } from './dashboard';

export interface SendChatMessagePayload {
  message: string;
  task?: string;
  session_id?: string;
}

export interface ChatMessageResponseData {
  session_id: string;
  message: ChatMessage;
}

export interface ChatErrorPayload {
  message: string;
}

export type ChatStreamEventName = 'meta' | 'chunk' | 'done' | 'error';

export interface ChatStreamMetaPayload {
  session_id?: string;
  cached?: boolean;
  guarded?: boolean;
}

export interface ChatStreamChunkPayload {
  chunk: string;
}

export interface ChatStreamDonePayload {
  session_id: string;
  message: ChatMessage;
}

export type ChatStreamEventPayloadByName = {
  meta: ChatStreamMetaPayload;
  chunk: ChatStreamChunkPayload;
  done: ChatStreamDonePayload;
  error: ChatErrorPayload;
};

export interface ChatSessionView extends ChatSession {
  active?: boolean;
}

export interface ChatMessageView extends ChatMessage {
  isPending?: boolean;
  isError?: boolean;
}

export type ApiSpecialEndpointData = {
  '/user': User;
  '/auth/login': { user: User; token?: string };
  '/reports/dashboard': DashboardStats;
};
