import type { ChatTask } from './enums';
import type { Employee } from './employee';

export interface ChatSession {
  id: number | string;
  session_id?: string;
  title?: string;
  model?: string;
  created_at?: string;
  updated_at?: string;
  last_message?: string;
  last_message_at?: string;
  message_count?: number;
}

export interface ChatMessage {
  id: number | string;
  session_id?: string;
  role: 'user' | 'assistant' | 'system' | string;
  message?: string;
  response?: string;
  response_text?: string;
  content?: string;
  text?: string;
  task?: ChatTask | null;
  context?: Record<string, unknown> | null;
  model?: string;
  status?: string;
  cached?: boolean;
  guarded?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LateAttendanceNotification {
  id: number | string;
  date?: string;
  employee_id?: number;
  employee?: Employee;
  employee_name?: string;
  check_in?: string;
  late_minutes?: number;
  late_after?: string;
  notified?: boolean;
  note?: string;
}
