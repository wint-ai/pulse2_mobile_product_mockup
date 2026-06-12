import { useEffect, useRef } from 'react';

/**
 * Plays a one-shot confetti burst + thank-you toast when `trigger` changes.
 * Self-contained — renders into a portal-like absolute container that
 * disappears after ~2.4s.
 *
 * @param {number|string} trigger — when this value changes, the celebration plays.
 */
export default function TagCelebration({ trigger }) {
  const containerRef = useRef(null);
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    const container = containerRef.current;
    if (!container) return;

    // Inject keyframes once.
    if (!document.getElementById('tag-celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'tag-celebration-styles';
      style.textContent = `
        @keyframes tc-confetti {
          0%   { transform: translate(0, 0) rotate(0); opacity: 1; }
          100% { transform: translate(var(--tcdx), var(--tcdy)) rotate(var(--tcr)); opacity: 0; }
        }
        @keyframes tc-toast {
          0%   { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
          15%  { transform: translate(-50%, 0) scale(1.05); opacity: 1; }
          25%  { transform: translate(-50%, 0) scale(1); opacity: 1; }
          85%  { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -10px) scale(0.95); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Centred near the top of the visible area (above the bottom sheet zone).
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = Math.min(120, rect.height * 0.3);

    const colors = ['#C568D9', '#04ADEF', '#5C9E1A', '#F05C25', '#DB4670', '#FFD700'];
    const pieces = [];

    for (let i = 0; i < 18; i++) {
      const piece = document.createElement('div');
      piece.style.cssText = `
        position: absolute; width: 8px; height: 8px;
        left: ${cx}px; top: ${cy}px;
        background: ${colors[i % colors.length]};
        border-radius: 2px; pointer-events: none;
      `;
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
      const dist = 90 + Math.random() * 50;
      piece.style.setProperty('--tcdx', Math.cos(angle) * dist + 'px');
      piece.style.setProperty('--tcdy', Math.sin(angle) * dist + 'px');
      piece.style.setProperty('--tcr', (Math.random() * 720 - 360) + 'deg');
      piece.style.animation = 'tc-confetti 0.9s ease-out forwards';
      container.appendChild(piece);
      pieces.push(piece);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute; left: 50%; bottom: 24px;
      background: #14151A; color: #fff; border-radius: 10px;
      padding: 10px 16px; font-size: 13px; font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      display: flex; align-items: center; gap: 8px;
      pointer-events: none; opacity: 0; white-space: nowrap;
      animation: tc-toast 2.4s ease-out forwards;
    `;
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; color: #C568D9; font-size: 16px;">label</span>
      <span>Thanks for tagging! Your insights help everyone.</span>
    `;
    container.appendChild(toast);

    const cleanupId = setTimeout(() => {
      pieces.forEach(p => p.remove());
      toast.remove();
    }, 2600);

    return () => clearTimeout(cleanupId);
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 250,
        overflow: 'hidden',
      }}
    />
  );
}
