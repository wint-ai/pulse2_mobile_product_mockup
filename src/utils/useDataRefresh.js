// Cross-tab data refresh: the storage event fires on this tab when another
// tab mutates localStorage. We bump a tick counter to trigger re-render of
// screens that read from the simulator-driven data stores.

import { useEffect, useState } from 'react';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pulse2-push') : null;

export function useDataRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick(t => t + 1);

    // Cross-tab — fires only on tabs other than the writer
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith('pulse2-')) bump();
    };
    window.addEventListener('storage', onStorage);

    // Same-tab BroadcastChannel — bump on every event that COULD have
    // mutated the data layer. The pusher publishes 'data-changed' after
    // each write, but cross-device pushes arriving via the ntfy.sh bridge
    // are relayed as the raw 'push' / 'demo-reset' / 'actor-changed'
    // event type, never wrapped in a 'data-changed' envelope. Listen for
    // all of them so the System page (and any other useDataRefresh
    // consumer) re-renders regardless of how the push arrived.
    const REFRESH_TYPES = new Set([
      'data-changed', 'push', 'demo-reset', 'actor-changed',
    ]);
    const onMessage = (ev) => {
      if (ev?.data?.type && REFRESH_TYPES.has(ev.data.type)) bump();
    };
    channel?.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.removeEventListener('message', onMessage);
    };
  }, []);
}
