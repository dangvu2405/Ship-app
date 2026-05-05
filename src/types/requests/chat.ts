export type StoreChatMessageRequest = {
  message: string;
  session_id?: string;
  task?: string | null;
  context?: Record<string, unknown> | null;
  model?: string | null;
};

export type GetChatMessagesRequest = {
  session_id: string;
  limit?: number;
};

export type GetChatSessionsRequest = {
  limit?: number;
};
