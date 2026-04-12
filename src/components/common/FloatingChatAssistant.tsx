import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';

import { ChatAssistantPanel } from '@/components/common/ChatAssistantPanel';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export const FloatingChatAssistant = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });

  const dragStateRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const BUBBLE_SIZE = 56;
  const EDGE_GAP = 8;

  const clampAnchor = useCallback((x: number, y: number) => {
    const maxX = Math.max(EDGE_GAP, viewport.width - BUBBLE_SIZE - EDGE_GAP);
    const maxY = Math.max(EDGE_GAP, viewport.height - BUBBLE_SIZE - EDGE_GAP);

    return {
      x: Math.min(Math.max(x, EDGE_GAP), maxX),
      y: Math.min(Math.max(y, EDGE_GAP), maxY),
    };
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      setAnchor((prev) => {
        const isNotInitialized = prev.x === 0 && prev.y === 0;
        if (isNotInitialized) {
          return {
            x: Math.max(EDGE_GAP, width - BUBBLE_SIZE - 24),
            y: Math.max(EDGE_GAP, height - BUBBLE_SIZE - 24),
          };
        }

        const maxX = Math.max(EDGE_GAP, width - BUBBLE_SIZE - EDGE_GAP);
        const maxY = Math.max(EDGE_GAP, height - BUBBLE_SIZE - EDGE_GAP);
        return {
          x: Math.min(Math.max(prev.x, EDGE_GAP), maxX),
          y: Math.min(Math.max(prev.y, EDGE_GAP), maxY),
        };
      });
    };

    syncViewport();

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStateRef.current.moved = true;
      }

      setAnchor(clampAnchor(drag.originX + dx, drag.originY + dy));
    };

    const handlePointerUp = () => {
      dragStateRef.current.dragging = false;
    };

    window.addEventListener('resize', syncViewport);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [clampAnchor]);

  const handleDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: anchor.x,
      originY: anchor.y,
      moved: false,
    };
  };

  const handleBubblePointerUp = () => {
    if (!dragStateRef.current.moved) {
      setOpen((prev) => !prev);
    }
  };

  const panelPosition = useMemo(() => {
    if (!viewport.width || !viewport.height) {
      return { left: EDGE_GAP, top: EDGE_GAP, width: 320, maxHeight: 400 };
    }

    const width = Math.min(980, Math.max(320, viewport.width - 16));
    const maxHeight = Math.max(320, viewport.height - 16);

    let left = anchor.x + BUBBLE_SIZE + 10;
    if (left + width > viewport.width - EDGE_GAP) {
      left = anchor.x - width - 10;
    }
    left = Math.max(EDGE_GAP, Math.min(left, viewport.width - width - EDGE_GAP));

    const desiredTop = anchor.y - 12;
    const top = Math.max(EDGE_GAP, Math.min(desiredTop, viewport.height - maxHeight - EDGE_GAP));

    return { left, top, width, maxHeight };
  }, [anchor.x, anchor.y, viewport.height, viewport.width]);

  return (
    <>
      <div className="fixed z-50" style={{ left: anchor.x, top: anchor.y }}>
        <button
          type="button"
          onPointerDown={handleDragStart}
          onPointerUp={handleBubblePointerUp}
          style={{ touchAction: 'none' }}
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
          style={{ left: panelPosition.left, top: panelPosition.top, width: panelPosition.width, maxHeight: panelPosition.maxHeight }}
        >
          <div
            className="flex cursor-move items-center justify-between border-b bg-muted/40 px-3 py-2"
            onPointerDown={handleDragStart}
            style={{ touchAction: 'none' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="h-4 w-4" />
              {t('notificationCenter.chat.title')}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
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
