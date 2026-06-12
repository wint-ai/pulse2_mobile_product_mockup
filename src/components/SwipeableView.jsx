import { useRef, useCallback } from 'react';

export default function SwipeableView({ children, onSwipeLeft, onSwipeRight }) {
  const touchRef = useRef({ startX: 0, startY: 0 });

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchRef.current = { startX: touch.clientX, startY: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;

    // Only trigger if horizontal swipe > 50px and more horizontal than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      {children}
    </div>
  );
}
