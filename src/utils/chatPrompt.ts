export type ChatTask = 'chat' | 'classify' | 'extract' | 'advice' | 'fallback';

type PromptVariables = {
  message: string;
  item?: string;
  from?: string;
  to?: string;
};

const SYSTEM_PROMPT =
  'Bạn là trợ lý Ship-app. Trả lời ngắn, rõ, đúng nghiệp vụ vận chuyển. Ưu tiên tiếng Việt. Nếu thiếu dữ liệu, chỉ hỏi đúng 1 câu ngắn. Không dùng markdown.';

const PROMPT_TEMPLATES: Record<ChatTask, string> = {
  chat: 'Câu hỏi khách hàng: "{{message}}"\nTrả lời tối đa 3 câu ngắn, có thể hành động ngay.',
  classify:
    'Phân loại câu sau, chỉ trả đúng 1 nhãn: ORDER | PRICE | TRACKING | OTHER.\nCâu: "{{message}}"',
  extract:
    'Trả JSON hợp lệ duy nhất, không giải thích.\nSchema:\n{"sender":null,"phone":null,"from":null,"to":null,"item":null}\nNội dung: "{{message}}"',
  advice:
    'Hàng "{{item}}" từ "{{from}}" đến "{{to}}".\nĐưa ra 1 khuyến nghị đóng gói, tối đa 20 từ.',
  fallback:
    'Viết 1 câu xin lỗi lịch sự, cực ngắn, báo hệ thống đang bận và mời thử lại sau.',
};

const interpolate = (template: string, variables: PromptVariables): string =>
  template
    .replace(/\{\{message\}\}/g, variables.message || '')
    .replace(/\{\{item\}\}/g, variables.item || 'hàng hóa')
    .replace(/\{\{from\}\}/g, variables.from || 'điểm lấy')
    .replace(/\{\{to\}\}/g, variables.to || 'điểm giao');

export const buildPromptByTask = (task: ChatTask, variables: PromptVariables): string => {
  const template = PROMPT_TEMPLATES[task] ?? PROMPT_TEMPLATES.chat;
  return `${SYSTEM_PROMPT}\n\n${interpolate(template, variables).trim()}`.trim();
};
