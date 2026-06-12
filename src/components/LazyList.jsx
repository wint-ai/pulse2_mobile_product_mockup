// LazyList — renders items in batches as user scrolls
// Simpler than full virtual scroll — loads more items when near bottom

import { useState, useEffect, useRef } from 'react';

const BATCH_SIZE = 20;

export default function LazyList({ items, renderItem, batchSize = BATCH_SIZE, emptyMessage = 'No items' }) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const containerRef = useRef(null);

  // Reset when items change
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [items, batchSize]);

  // Load more on scroll
  useEffect(() => {
    const container = containerRef.current?.closest('[style*="overflow"]') || containerRef.current?.parentElement;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 200 && visibleCount < items.length) {
        setVisibleCount(prev => Math.min(prev + batchSize, items.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleCount, items.length, batchSize]);

  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: 20, color: '#9DA3AE', fontSize: 14 }}>{emptyMessage}</div>;
  }

  const visible = items.slice(0, visibleCount);

  return (
    <div ref={containerRef}>
      {visible.map((item, i) => renderItem(item, i))}
      {visibleCount < items.length && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#9DA3AE', fontSize: 13 }}>
          Showing {visibleCount} of {items.length} · scroll for more
        </div>
      )}
    </div>
  );
}
