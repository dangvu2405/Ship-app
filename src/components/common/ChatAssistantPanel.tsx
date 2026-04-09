import { Bot, Loader2, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, RefreshCcw, Send, UserRound } from 'lucide-react';
import type { ChatTask } from '@/utils/chatPrompt';
// toast import removed

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageRenderer } from '@/components/common/chat/MessageRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
// utils removed



const DEFAULT_MODEL = 'gemini-2.0-flash';



type ChatAssistantPanelProps = {
  className?: string;
  compact?: boolean;
};

import { useChatSession, formatDateTime } from '@/hooks/useChatSession';

export const ChatAssistantPanel = ({ className, compact = false }: ChatAssistantPanelProps) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const {
    sessionId,
    setSessionId,
    sessions,
    chatMessages,
    sessionsLoading,
    messagesLoading,
    sendingMessage,
    chatMessage,
    setChatMessage,
    model,
    setModel,
    task,
    setTask,
    contextJson,
    setContextJson,
    responseMeta,
    sessionsCollapsed,
    setSessionsCollapsed,
    selectedSessionIds,
    deletingSessions,
    loadSessions,
    handleSendChat,
    handleStartNewChat,
    handleMessagesScroll,
    getRetrySourceFromIndex,
    handleToggleSessionSelection,
    handleSelectAllSessions,
    handleDeleteSessions,
    messagesContainerRef,
    messagesEndRef,
    activeSession,
    selectedCount,
    allSelected,
    hasPartialSelection
  } = useChatSession(t);

  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Card className={cn(compact ? 'min-h-0' : 'min-h-[760px]', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('notificationCenter.chat.title')}
            </CardTitle>
            <CardDescription>{t('notificationCenter.chat.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadSessions()} disabled={sessionsLoading}>
            {sessionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {t('notificationCenter.refresh')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {responseMeta.cached ? <Badge variant="secondary">{t('notificationCenter.chat.cached')}</Badge> : null}
          {responseMeta.guarded ? <Badge variant="outline">{t('notificationCenter.chat.guarded')}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          'grid gap-4',
          sessionsCollapsed
            ? compact
              ? 'md:grid-cols-[62px_minmax(0,1fr)]'
              : 'lg:grid-cols-[68px_minmax(0,1fr)]'
            : compact
              ? 'md:grid-cols-[220px_minmax(0,1fr)]'
              : 'lg:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        <div className={cn('space-y-3 rounded-lg border bg-muted/20 transition-all', sessionsCollapsed ? 'p-2' : 'p-3')}>
          <div className={cn('flex items-center gap-2', sessionsCollapsed ? 'justify-center' : 'justify-between')}>
            {!sessionsCollapsed ? (
              <div>
                <p className="text-sm font-medium">{t('notificationCenter.chat.sessions')}</p>
                <p className="text-xs text-muted-foreground">{sessions.length} {t('notificationCenter.chat.available')}</p>
              </div>
            ) : null}

            <div className={cn('flex items-center gap-1', sessionsCollapsed && 'flex-col')}>
              <Button
                variant="ghost"
                size={sessionsCollapsed ? 'icon' : 'sm'}
                onClick={handleStartNewChat}
                title={t('notificationCenter.chat.newChat')}
              >
                <Plus className={cn('h-4 w-4', sessionsCollapsed ? '' : 'mr-2')} />
                {!sessionsCollapsed ? t('notificationCenter.chat.newChat') : null}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSessionsCollapsed((prev) => !prev)}
                title={t('notificationCenter.chat.sessions')}
                aria-label={t('notificationCenter.chat.sessions')}
              >
                {sessionsCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!sessionsCollapsed ? (
            <div className={cn('space-y-2 overflow-y-auto pr-1', compact ? 'max-h-[420px]' : 'max-h-[620px]')}>
              <div className="rounded-md border bg-background p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor="chat-select-all" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      id="chat-select-all"
                      checked={allSelected ? true : hasPartialSelection ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAllSessions}
                    />
                    {t('notificationCenter.chat.selectAll')}
                  </Label>
                  <span className="text-xs text-muted-foreground">{selectedCount}/{sessions.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 flex-1"
                    loading={deletingSessions}
                    disabled={selectedCount === 0}
                    onClick={() => void handleDeleteSessions(selectedSessionIds)}
                  >
                    {t('notificationCenter.chat.deleteSelected')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1"
                    loading={deletingSessions}
                    disabled={sessions.length === 0}
                    onClick={() => void handleDeleteSessions(sessions.map((session) => session.id))}
                  >
                    {t('notificationCenter.chat.deleteAll')}
                  </Button>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('notificationCenter.loading')}
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {t('notificationCenter.chat.emptySessions')}
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => setSessionId(session.id)}
                    className={cn(
                      'w-full block rounded-md border p-3 text-left transition-colors',
                      session.id === sessionId ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Checkbox
                          checked={selectedSessionIds.includes(session.id)}
                          onCheckedChange={(checked) => handleToggleSessionSelection(session.id, checked)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={session.title}
                        />
                        <p className="line-clamp-1 font-medium">{session.title}</p>
                      </div>
                      {session.model ? <Badge variant="secondary" className="text-[10px]">{session.model}</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{session.preview || t('notificationCenter.chat.noPreview')}</p>
                    {session.updatedAt ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(session.updatedAt)}</p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{activeSession?.title || t('notificationCenter.chat.newChat')}</p>
                <p className="text-sm text-muted-foreground">
                  {activeSession?.preview || t('notificationCenter.chat.composeHint')}
                </p>
              </div>
              {activeSession?.model ? (
                <Badge variant="outline">{activeSession.model}</Badge>
              ) : null}
            </div>

            <Separator className="my-4" />

            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className={cn('space-y-3 overflow-y-auto pr-1 overscroll-contain', compact ? 'max-h-[320px] min-h-[240px]' : 'max-h-[420px] min-h-[420px]')}
            >
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('notificationCenter.chat.loadingMessages')}
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <Bot className="h-8 w-8" />
                  <p>{t('notificationCenter.chat.emptyMessages')}</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const isAssistantError = !isUser && message.isError === true;
                    const retrySource = isAssistantError ? getRetrySourceFromIndex(index) : '';
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isUser
                              ? 'bg-primary text-primary-foreground'
                              : isAssistantError
                                ? 'border border-destructive/40 bg-destructive/10'
                                : 'bg-muted'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                            {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            <span>{isUser ? t('notificationCenter.chat.you') : t('notificationCenter.chat.assistant')}</span>
                            {message.model ? <span>• {message.model}</span> : null}
                            {isAssistantError ? <Badge variant="destructive">{t('notificationCenter.chat.failed')}</Badge> : null}
                          </div>
                          {message.isPending ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              <span className="inline-flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {message.content}
                              </span>
                            </p>
                          ) : isUser ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                          ) : (
                            <MessageRenderer content={message.content} />
                          )}
                          {message.createdAt ? (
                            <p className="mt-2 text-[11px] opacity-70">{formatDateTime(message.createdAt)}</p>
                          ) : null}
                          {isAssistantError && retrySource ? (
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7"
                                onClick={() => void handleSendChat(retrySource)}
                                disabled={sendingMessage}
                              >
                                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                                {t('notificationCenter.chat.retrySend')}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label htmlFor="chat-message">{t('notificationCenter.chat.message')}</Label>
              <Textarea
                id="chat-message"
                name="chat_message"
                autoComplete="off"
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    if (!sendingMessage) {
                      void handleSendChat();
                    }
                  }
                }}
                placeholder={t('notificationCenter.chat.messagePlaceholder')}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="chat-task">{t('notificationCenter.chat.task')}</Label>
                <Select value={task} onValueChange={(value) => setTask(value as ChatTask)}>
                  <SelectTrigger id="chat-task">
                    <SelectValue placeholder={t('notificationCenter.chat.taskPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">{t('notificationCenter.chat.taskChat')}</SelectItem>
                    <SelectItem value="classify">{t('notificationCenter.chat.taskClassify')}</SelectItem>
                    <SelectItem value="extract">{t('notificationCenter.chat.taskExtract')}</SelectItem>
                    <SelectItem value="advice">{t('notificationCenter.chat.taskAdvice')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="chat-model">{t('notificationCenter.chat.model')}</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="chat-model">
                    <SelectValue placeholder={DEFAULT_MODEL} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                    <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                    <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="chat-context">{t('notificationCenter.chat.context')}</Label>
                <Input
                  id="chat-context"
                  name="chat_context"
                  autoComplete="off"
                  value={contextJson}
                  onChange={(event) => setContextJson(event.target.value)}
                  placeholder={t('notificationCenter.chat.contextPlaceholder')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t('notificationCenter.chat.contextHint')}</p>
              <Button onClick={() => void handleSendChat()} loading={sendingMessage}>
                {!sendingMessage ? <Send className="mr-2 h-4 w-4" /> : null}
                {t('notificationCenter.chat.send')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
