import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Typography, theme } from 'antd';

import { ChatAssistantPanel } from '@/components/common/ChatAssistantPanel';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth.store';

export const FloatingChatAssistant = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });

  const isChatVisible = isAuthenticated && hasAuthToken();

  if (!isChatVisible) {
    return null;
  }

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
      return { left: EDGE_GAP, top: EDGE_GAP, width: 380, maxHeight: 640 };
    }

    const width = Math.min(420, Math.max(360, viewport.width - 24));
    const maxHeight = Math.min(760, Math.max(420, viewport.height - 24));

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
          style={{
            touchAction: 'none',
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `1px solid ${token.colorPrimaryBorder}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorPrimary,
            color: token.colorTextLightSolid,
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.2)',
          }}
          aria-label={t('notificationCenter.chat.title')}
        >
          {open ? <CloseOutlined style={{ fontSize: 20 }} /> : <MessageOutlined style={{ fontSize: 20 }} />}
        </button>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, textAlign: 'center', fontSize: 10 }}>
          {t('notificationCenter.chat.title')}
        </Typography.Text>
      </div>

      {open ? (
        <div
          style={{
            position: 'fixed',
            zIndex: 60,
            overflow: 'hidden',
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.2)',
            left: panelPosition.left,
            top: panelPosition.top,
            width: panelPosition.width,
            maxHeight: panelPosition.maxHeight,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${token.colorSplit}`,
              background: token.colorPrimaryBg,
              padding: '10px 12px',
              cursor: 'move',
              touchAction: 'none',
            }}
            onPointerDown={handleDragStart}
          >
            <Typography.Text strong style={{ display: 'flex', alignItems: 'center', gap: 8, color: token.colorPrimaryText }}>
              <MessageOutlined />
              {t('notificationCenter.chat.title')}
            </Typography.Text>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} aria-label="Close" />
          </div>

          <div style={{ overflow: 'auto', padding: 0, maxHeight: 'calc(100vh - 80px)' }}>
            <ChatAssistantPanel compact style={{ boxShadow: 'none', border: 'none' }} />
          </div>
        </div>
      ) : null}
    </>
  );
};
