# AI Spec – Chat Module (Ship-app)
<!-- version: 1.0 | updated: 2026-04-09 -->

> **Mục đích**: Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho bất kỳ AI agent nào làm việc trên Chat Module của ship-app. Đọc kỹ toàn bộ trước khi chỉnh sửa bất cứ file nào liên quan.

---

## 0. Quick-reference File Map

| File | Vai trò |
|------|---------|
| `src/services/chat.service.ts` | HTTP layer – gọi API, parse SSE stream |
| `src/hooks/useChatSession.ts` | State machine trung tâm – mọi logic chat |
| `src/components/common/ChatAssistantPanel.tsx` | UI chính (card layout) |
| `src/components/common/FloatingChatAssistant.tsx` | Floating button + panel overlay |
| `src/components/common/chat/MessageRenderer.tsx` | Render markdown cho assistant message |
| `src/utils/chatPrompt.ts` | Type `ChatTask` và helper prompt |
| `src/utils/chatResponse.ts` | Normalize payload API → internal types |
| `src/utils/errorHandler.ts` | `getErrorMessage`, `getErrorStatus`, `isNetworkError`, `isTimeoutError` |
| `src/services/endpoints.ts` | Tập trung tất cả endpoint URL |
| `src/types/index.ts` | Type `ChatMessage`, `ChatSession`, `ApiResponse` |

---

## 1. Backend API Contract

### 1.1 Base

```
Base URL (local):   http://localhost:8080
Prefix:             /api
Auth header:        Authorization: Bearer <token>
```

### 1.2 Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| `POST` | `/api/chat/messages` | Gửi tin nhắn, nhận JSON |
| `POST` | `/api/chat/messages/stream` | Gửi tin nhắn, nhận SSE stream |
| `GET`  | `/api/chat/messages?session_id=<id>&limit=30` | Lấy lịch sử tin nhắn |
| `GET`  | `/api/chat/sessions?limit=20` | Lấy danh sách session |
| `DELETE` | `/api/chat/sessions/{id}` | Xóa session |

### 1.3 Request Body (JSON & Stream)

```typescript
interface SendChatMessagePayload {
  message: string;                          // bắt buộc
  task?: 'chat' | 'classify' | 'extract' | 'advice'; // default: 'chat'
  session_id?: string;                      // optional, server tạo mới nếu không có
  context?: Record<string, unknown>;        // vd: { company_id: 1 }
  model?: string;                           // default: 'gemini-2.0-flash'
}
```

### 1.4 JSON Response (POST /api/chat/messages)

```json
{
  "success": true,
  "message": "Chat response generated",
  "data": {
    "session_id": "string",
    "message": {
      "id": 1,
      "message": "...",
      "response": "...",
      "model": "gemini-2.0-flash | local-fallback-429 | local-guard",
      "status": "success"
    },
    "cached": false,
    "guarded": false
  }
}
```

> ⚠️ **QUY TẮC PARSE**: Nội dung assistant LUÔN đọc tại `data.message.response` (KHÔNG phải `data.message.message`).

### 1.5 SSE Stream Events (POST /api/chat/messages/stream)

Mỗi event theo định dạng:
```
event: <name>
data: <json string>

```
(2 newline kết thúc mỗi event)

| Event | Payload | Hành động |
|-------|---------|-----------|
| `meta` | `{ session_id, cached, guarded }` | Lưu session_id, cập nhật responseMeta |
| `chunk` | `{ index: number, text: string }` | Nối text vào bubble đang pending |
| `done` | Full payload như JSON endpoint | Finalize message, reload sessions |
| `error` | `{ message: string }` | Throw error, hiển thị lỗi |

---

## 2. Data Types (Internal Frontend)

```typescript
// Từ src/types/index.ts
interface ChatSession {
  id: string;
  session_id?: string;
  title?: string;
  last_message?: string;
  model?: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string | number;
  role?: string;
  message?: string;
  response?: string;
  response_text?: string;
  content?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  created_at?: string;
}

// View types trong useChatSession.ts (internal, không export)
type ChatSessionView = {
  id: string;
  title: string;
  preview: string;
  updatedAt?: string;
  model?: string;
};

type ChatMessageView = {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  isPending?: boolean;   // true khi đợi response
  isError?: boolean;     // true khi call thất bại
};
```

---

## 3. Service Layer (chat.service.ts)

### Quy tắc bất biến:

1. **Không bao giờ** gọi API trực tiếp từ component — luôn qua `chatService`.
2. `sendMessageStream()` sử dụng **native `fetch` + `ReadableStream`** (không dùng axios) vì axios không hỗ trợ SSE streaming.
3. Token lấy từ `localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)`.
4. Mọi response JSON đều được normalize qua `utils/chatResponse.ts` trước khi return.
5. `deleteSession(id)` gọi `DELETE /api/chat/sessions/{id}`.

### SSE Parsing logic (phải giữ nguyên):

```typescript
// Buffer pattern – chuẩn SSE
buffer += decoder.decode(value, { stream: true });
const events = buffer.split(/\r?\n\r?\n/);
buffer = events.pop() || '';
// Flush buffer cuối sau khi done stream
buffer += decoder.decode();
```

---

## 4. State Hook (useChatSession.ts)

### 4.1 State Variables

| State | Type | Mô tả |
|-------|------|-------|
| `sessionId` | `string` | Session đang active (`''` = new chat) |
| `sessions` | `ChatSessionView[]` | Danh sách session |
| `chatMessages` | `ChatMessageView[]` | Messages của session hiện tại |
| `sessionsLoading` | `boolean` | Loading skeleton cho sessions |
| `messagesLoading` | `boolean` | Loading khi fetch messages |
| `sendingMessage` | `boolean` | Disable nút Send khi đang gửi |
| `chatMessage` | `string` | Giá trị textarea |
| `model` | `string` | Model đang chọn (default: `'gemini-2.0-flash'`) |
| `task` | `ChatTask` | Task type (default: `'chat'`) |
| `contextJson` | `string` | Context JSON dạng string |
| `responseMeta` | `{ cached?, guarded? }` | Meta từ response cuối cùng |
| `sessionsCollapsed` | `boolean` | Thu gọn sidebar sessions |
| `selectedSessionIds` | `string[]` | Các session được chọn để xóa |
| `deletingSessions` | `boolean` | Loading khi đang xóa sessions |

### 4.2 Constants

```typescript
const DEFAULT_MODEL = 'gemini-2.0-flash';
const ERROR_TOAST_DEDUPE_MS = 2000;     // Chống spam toast error
const MAX_CHAT_INPUT_LENGTH = 2000;     // Giới hạn ký tự message
```

### 4.3 Refs (quan trọng, không nhầm với state)

| Ref | Mục đích |
|-----|---------|
| `messagesContainerRef` | Attach scroll handler |
| `messagesEndRef` | Auto-scroll đến cuối |
| `shouldAutoScrollRef` | Chỉ auto-scroll nếu user ở cuối (< 120px từ bottom) |
| `sessionsInFlightRef` | Chống duplicate sessions request |
| `messagesRequestIdRef` | Race condition guard cho messages fetch |
| `toastDedupeRef` | Lưu timestamp toast cuối cho mỗi key |

### 4.4 handleSendChat – Flow đầy đủ

```
1. Guard: sendingMessage? → return
2. Sanitize: sanitizeUserText(message) → stripHtml + normalize
3. Validate: length < 1 → toast error | > 2000 → toast error
4. Spam check: isObviousSpam() → toast warning (không block)
5. Parse contextJson → JSON.parse() nếu có
6. Optimistic UI: push tmp-user + tmp-assistant (isPending=true)
7. setSendingMessage(true)
8. Retry loop (max 2 attempts):
   a. Thử sendMessageStream()
   b. Nếu stream rỗng → fallback sendMessage() (JSON)
   c. Nếu lỗi 429 / network / timeout + attempt 0 → delay 700ms, retry
9. Trên success:
   - Update optimistic assistant message (isPending=false, isError=false)
   - Clear chatMessage input
   - setSessionId(nextSessionId)
   - loadSessions (force)
   - loadMessages (delay 500ms nếu had stream chunks)
   - toast.success
10. Trên error:
    - Update optimistic assistant (isPending=false, isError=true)
    - toast.error (với message từ getErrorMessage)
11. Finally: setSendingMessage(false)
```

### 4.5 loadSessions

- Guard: `sessionsInFlightRef.current && !force` → skip
- Gọi `chatService.getSessions(20)`
- Normalize với `normalizeChatSession()`
- Nếu `preferredSessionId` tồn tại trong kết quả → set đó
- Else: set session đầu tiên nếu chưa có active session

### 4.6 loadMessages

- Race condition guard: `messagesRequestIdRef` (chỉ update state nếu là request mới nhất)
- Merge với local optimistic messages: `mergeServerMessagesWithLocal()`
- Merge rule: Giữ lại optimistic messages (id bắt đầu `tmp-` hoặc `isPending=true`) nếu chưa có equivalent trên server

---

## 5. UI Component (ChatAssistantPanel.tsx)

### 5.1 Props

```typescript
type ChatAssistantPanelProps = {
  className?: string;
  compact?: boolean;   // true → dùng trong FloatingChatAssistant, heights nhỏ hơn
};
```

### 5.2 Layout Grid

```
Card
├── CardHeader
│   ├── Title + Refresh button
│   └── Badges: [cached] [guarded]
└── CardContent (CSS Grid)
    ├── Sessions Panel (collapsible sidebar)
    │   ├── Header: "New Chat" + Collapse toggle
    │   └── Sessions list
    │       ├── Select All checkbox + counter
    │       ├── Delete Selected / Delete All buttons
    │       └── Session items (checkbox + title + preview + date)
    └── Chat Area
        ├── Active session header (title + model badge)
        ├── Messages container (ref=messagesContainerRef)
        │   └── Message bubbles
        │       ├── User: right-aligned, bg-primary
        │       ├── Assistant: left-aligned, bg-muted
        │       └── Error: border-destructive/40 bg-destructive/10
        └── Compose area
            ├── Textarea (chat-message)
            ├── Select task (chat-task)
            ├── Select model (chat-model)
            ├── Input context JSON (chat-context)
            └── Send button
```

### 5.3 Grid columns

```css
/* Collapsed */
compact: md:grid-cols-[62px_minmax(0,1fr)]
default: lg:grid-cols-[68px_minmax(0,1fr)]

/* Expanded */
compact: md:grid-cols-[220px_minmax(0,1fr)]
default: lg:grid-cols-[280px_minmax(0,1fr)]
```

### 5.4 Heights

```css
/* Messages container */
compact:  max-h-[320px] min-h-[240px]
default:  max-h-[420px] min-h-[420px]

/* Sessions list */
compact:  max-h-[420px]
default:  max-h-[620px]

/* Card */
compact:  min-h-0
default:  min-h-[760px]
```

### 5.5 Message Bubble Rules

| Condition | Style |
|-----------|-------|
| `isUser` | `bg-primary text-primary-foreground`, justify-end |
| `isAssistantError` | `border border-destructive/40 bg-destructive/10`, justify-start |
| `isPending` | Hiển thị `<Loader2 animate-spin>` + content |
| Normal assistant | `bg-muted`, render qua `<MessageRenderer>` |

- `isAssistantError = !isUser && message.isError === true`
- Khi có lỗi: hiển thị nút Retry → gọi `handleSendChat(retrySource)`
- `retrySource` = content của user message trước đó (`getRetrySourceFromIndex`)

### 5.6 Model badges

- Badges `cached` và `guarded` hiển thị ở **CardHeader** (dùng `responseMeta`)
- Session item: hiển thị `session.model` dưới dạng Badge
- Message: hiển thị `message.model` inline trong header của bubble

---

## 6. Backend Behaviors FE phải xử lý

| Tình huống | Backend trả | FE phải làm |
|-----------|-------------|-------------|
| Message < 3 ký tự | `model = 'local-guard'` | Hiển thị bình thường |
| Gemini 429 quota | `model = 'local-fallback-429'`, `success=true` | Hiển thị bình thường, không throw |
| Cache hit | `cached = true` | Badge "Cached" |
| Bị guard | `guarded = true` | Badge "Guarded" |

---

## 7. Input Validation & Sanitization

```typescript
// Thứ tự bắt buộc:
1. stripHtmlTags(text)    // Remove <script>, <style>, tags
2. normalizeText(text)    // NFKC normalize, fix newlines, trim
// = sanitizeUserText(text)

// Validation:
MAX_CHAT_INPUT_LENGTH = 2000
MIN = 1 (sau sanitize)

// Spam detection (isObviousSpam):
- Chuỗi lặp ký tự >= 12 lần: "aaaaaaaaaaaa"
- Từ lặp >= 70% trong message >= 8 từ
- Pattern lặp >= 80 chars (sau strip spaces)
→ toast warning nhưng KHÔNG block gửi
```

---

## 8. Error Handling

```typescript
// Từ utils/errorHandler.ts
getErrorMessage(error)   // Lấy message string từ error bất kỳ
getErrorStatus(error)    // Lấy HTTP status code
isNetworkError(error)    // true nếu là network error
isTimeoutError(error)    // true nếu là timeout

// Retry conditions:
shouldRetryChatRequest = status === 429 || isNetworkError || isTimeoutError

// Toast deduplication:
ERROR_TOAST_DEDUPE_MS = 2000ms (cùng key không spam toast)
```

---

## 9. i18n Keys (notificationCenter.chat.*)

```
title               – "Trợ lý AI"
description         – subtitle
sessions            – "Phiên hội thoại"
available           – "phiên"
newChat             – "New Chat"
selectAll           – "Chọn tất cả"
deleteSelected      – "Xóa đã chọn"
deleteAll           – "Xóa tất cả"
emptySessions       – empty state text
noPreview           – "(Không có xem trước)"
loadingMessages     – "Đang tải..."
emptyMessages       – empty state text
you                 – "Bạn"
assistant           – "Trợ lý"
failed              – "Thất bại"
waitingResponse     – "Đang chờ phản hồi..."
send                – "Gửi"
message             – "Tin nhắn"
messagePlaceholder  – placeholder
task                – "Nhiệm vụ"
taskPlaceholder     – placeholder
taskChat            – "Chat"
taskClassify        – "Phân loại"
taskExtract         – "Trích xuất"
taskAdvice          – "Tư vấn"
model               – "Model"
context             – "Context"
contextPlaceholder  – '{"company_id": 1}'
contextHint         – hint text
cached              – "Đã cache"
guarded             – "Bảo vệ"
composeHint         – hint khi chưa có session
messageRequired     – validation error
messageTooLong      – validation error (với {max})
spamWarning         – spam warning
invalidContext      – JSON parse error
sendError           – generic send error
sendSuccess         – "Gửi thành công"
rateLimited         – 429 error
retrying            – "Đang thử lại..."
retrySend           – "Thử lại"
loadSessionsError   – error text
loadMessagesError   – error text
deleteSessionsSuccess – "Đã xóa {count} phiên"
deleteSessionsError – "Thất bại {count} phiên"
deleteSessionError  – single delete error
```

---

## 10. Quy tắc bất biến cho AI (KHÔNG được vi phạm)

### ✅ PHẢI làm

1. **Luôn** normalize API response qua `utils/chatResponse.ts` — không parse thủ công trong hook/component.
2. **Luôn** dùng `sanitizeUserText()` trước khi gửi message.
3. **Luôn** dùng `showErrorToast(key, message)` thay vì `toast.error()` trực tiếp để tránh spam.
4. **Luôn** dùng `messagesRequestIdRef` pattern khi fetch async để guard race condition.
5. **Luôn** đặt `id` của các form element (textarea, select, input) theo chuẩn: `chat-message`, `chat-task`, `chat-model`, `chat-context`.
6. **Luôn** đọc response text tại `data.message.response` (JSON endpoint).
7. **Luôn** dùng `optimistic update` (thêm `tmp-` message ngay) trước khi gọi API.
8. **Luôn** dùng `getRetrySourceFromIndex()` để tìm message nguồn cho retry.

### ❌ KHÔNG được làm

1. **Không** gọi `fetch` hay `axios` trực tiếp trong component hay hook — phải qua `chatService`.
2. **Không** dùng `axios` cho stream endpoint — phải dùng native `fetch`.
3. **Không** xóa logic `mergeServerMessagesWithLocal` — cần cho optimistic UX.
4. **Không** dùng `toast.error()` trực tiếp trong loop/effect — phải dùng `showErrorToast`.
5. **Không** thêm model mới vào `<SelectContent>` mà không kiểm tra backend support.
6. **Không** thay đổi `MAX_CHAT_INPUT_LENGTH` hay `ERROR_TOAST_DEDUPE_MS` mà không cập nhật doc này.
7. **Không** bỏ `sessionsInFlightRef` guard — sẽ gây duplicate API calls.
8. **Không** để `isPending` bị `true` sau khi stream done — phải set `false` trong finally.

---

## 11. Models Available

| Model ID | Ghi chú |
|----------|---------|
| `gemini-2.0-flash` | Default |
| `gemini-1.5-flash` | Fallback |
| `gemini-1.5-pro` | Pro |
| `gpt-4o-mini` | OpenAI |
| `local-fallback-429` | Auto từ backend khi Gemini quota hết |
| `local-guard` | Auto từ backend khi message < 3 ký tự |

---

## 12. Checklist trước khi commit (Chat Module)

- [ ] `data.message.response` được đọc đúng field
- [ ] Stream SSE xử lý đủ `meta / chunk / done / error`
- [ ] Badge `cached` và `guarded` hiển thị đúng
- [ ] Badge `model` hiển thị trên session item và message bubble
- [ ] Nút Retry xuất hiện khi `isError = true`
- [ ] `isPending` spinner hiển thị khi chờ
- [ ] Textarea bị block khi `sendingMessage = true`
- [ ] `MAX_CHAT_INPUT_LENGTH` được validate
- [ ] Context JSON được parse và gửi đúng
- [ ] Session collapse/expand hoạt động
- [ ] Select All / Delete Selected / Delete All hoạt động
- [ ] Auto-scroll khi có message mới (chỉ nếu ở cuối)
- [ ] `formatDateTime` được dùng cho tất cả timestamp
- [ ] i18n keys không hardcode string tiếng Việt trong JSX

---

## 13. Liên quan đến tài liệu khác

| Tài liệu | Nội dung |
|----------|---------|
| `docs/UI_IMPROVEMENT_COMPONENT_GUIDE_VI.md` | Chat API handoff doc gốc (endpoint, SSE format, JS sample) |
| `src/utils/chatResponse.ts` | Normalize functions chi tiết |
| `src/utils/chatPrompt.ts` | ChatTask type definition |
| `src/services/endpoints.ts` | URL constants |

---

*Cập nhật tài liệu này mỗi khi thay đổi: API contract, state variables, constants, hoặc UI layout.*
