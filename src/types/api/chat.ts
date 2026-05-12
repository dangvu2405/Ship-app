import type { ChatMessage, ChatSession } from '../domain/chat';

export type SendChatMessageApiPayload = {
  message: string;
  task?: string;
  session_id?: string;
};

export type ChatMessageResponseResult = {
  session_id: string;
  message: ChatMessage;
};

/** @deprecated Use ChatMessageResponseResult */
export type ChatMessageResponseData = ChatMessageResponseResult;

export type ChatStreamErrorEvent = {
  message: string;
};

export type ChatStreamEventName = 'meta' | 'chunk' | 'done' | 'error';

export type ChatStreamMetaEvent = {
  session_id?: string;
  cached?: boolean;
  guarded?: boolean;
};

export type ChatStreamChunkEvent = {
  text?: string;
  chunk?: string;
};

export type ChatStreamDoneEvent = {
  session_id: string;
  message: ChatMessage;
};

export type ChatStreamEventMap = {
  meta: ChatStreamMetaEvent;
  chunk: ChatStreamChunkEvent;
  done: ChatStreamDoneEvent;
  error: ChatStreamErrorEvent;
};

/** @deprecated Use ChatStreamErrorEvent */
export type ChatErrorPayload = ChatStreamErrorEvent;

/** @deprecated Use ChatStreamMetaEvent */
export type ChatStreamMetaPayload = ChatStreamMetaEvent;

/** @deprecated Use ChatStreamChunkEvent */
export type ChatStreamChunkPayload = ChatStreamChunkEvent;

/** @deprecated Use ChatStreamDoneEvent */
export type ChatStreamDonePayload = ChatStreamDoneEvent;

/** @deprecated Use ChatStreamEventMap */
export type ChatStreamEventPayloadByName = ChatStreamEventMap;

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
