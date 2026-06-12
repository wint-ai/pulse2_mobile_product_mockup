// WINT opening splash - shows once per session when the app first loads.
//
// Uses the self-contained HTML splash file from public/splash/ (a sibling
// to vite-deployed assets). The HTML runs an SVG animation and fires a
// `wint-splash-complete` event when done. We listen for it from this
// React component and unmount when it fires.
//
// Files (untouched, dropped in as-is from design):
//   public/splash/wint-splash-screen-light.html   <- used here
//   public/splash/wint-splash-screen-navy.html    <- available, not wired
//   public/splash/README.md                       <- integration guide
//
// The splash overlay is absolutely positioned inside the Phone frame so
// it looks like the app launching on the device.

import { useEffect, useRef, useState } from 'react';

const SESSION_FLAG = 'wint-splash-shown';

// Splash is ON BY DEFAULT for cold app opens (no query params). The
// previous "notifications missing" issue was traced to the ntfy.sh
// daily-quota rate limit on the shared pulse2-demo room, not the splash
// itself - see fix in pushBridge.js (unique per-pusher room).
//
// We still SKIP the splash when:
//   - URL has ?p=<pair-code>  (paired phone scanning the QR - testing
//     session, no need for a launch splash + give the bridge a clean
//     subscribe window)
//   - URL has ?nosplash=1     (manual opt-out for any other case)
export function shouldShowSplash() {
  if (typeof sessionStorage === 'undefined') return false;
  if (typeof window === 'undefined') return false;

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('p')) return false;
    if (url.searchParams.get('nosplash') === '1') return false;
  } catch { return false; }

  return sessionStorage.getItem(SESSION_FLAG) !== '1';
}

function markSplashShown() {
  try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch { /* noop */ }
}

export default function SplashScreen({ variant = 'light', onComplete }) {
  const iframeRef = useRef(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wire the wint-splash-complete event from inside the iframe.
    // The HTML dispatches it on its own window. We have to attach to
    // contentWindow once the iframe has loaded its document.
    function attach() {
      const win = iframe.contentWindow;
      if (!win) return;
      const handler = () => {
        // Brief CSS fade-out before unmounting so the transition into
        // the app isn't a hard cut.
        setFading(true);
        setTimeout(() => {
          markSplashShown();
          if (onComplete) onComplete();
        }, 240);
      };
      win.addEventListener('wint-splash-complete', handler, { once: true });
      // Safety: if the splash never fires (e.g. animation API missing),
      // fall through after a worst-case ceiling.
      const fallback = setTimeout(handler, 5000);
      return () => {
        win.removeEventListener('wint-splash-complete', handler);
        clearTimeout(fallback);
      };
    }

    let cleanup;
    if (iframe.contentDocument?.readyState === 'complete') {
      cleanup = attach();
    } else {
      const onload = () => { cleanup = attach(); };
      iframe.addEventListener('load', onload);
      return () => {
        iframe.removeEventListener('load', onload);
        if (cleanup) cleanup();
      };
    }
    return () => { if (cleanup) cleanup(); };
  }, [onComplete]);

  const src = `${import.meta.env.BASE_URL}splash/wint-splash-screen-${variant}.html`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 10000,
        background: variant === 'navy' ? '#1e294c' : '#ffffff',
        opacity: fading ? 0 : 1,
        transition: 'opacity 220ms ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title="WINT splash"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
