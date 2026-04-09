import { useState } from 'react';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import X from 'lucide-react/dist/esm/icons/x';

import { ChatAssistantPanel } from '@/components/common/ChatAssistantPanel';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';

export const FloatingChatAssistant = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-2 ring-primary/20 transition hover:scale-[1.03]"
          aria-label={t('notificationCenter.chat.title')}
        >
          {open ? <X className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
        </button>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          {t('notificationCenter.chat.title')}
        </p>
      </div>

      {open ? (
        <div
          className="fixed z-50 overflow-hidden rounded-xl border bg-background shadow-2xl"
          style={{ right: 24, bottom: 96, width: 'min(980px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 120px)' }}
        >
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="h-4 w-4" />
              {t('notificationCenter.chat.title')}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t('common.close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-auto p-2 md:p-3" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            <ChatAssistantPanel compact className="border-0 shadow-none" />
          </div>
        </div>
      ) : null}
    </>
  );
};
