// Contextual onboarding — two phases:
// Phase 1: On Home screen — welcome + point to Systems tab
// Phase 2: On Systems screen — hamburger, drawer, tiles, tabs
import { useState, useEffect } from 'react';

// ─── Home phase steps ───────────────────────────────────────────────────────

const HOME_STEPS = [
  {
    title: 'Welcome to Pulse 2.0',
    body: 'Monitor your water systems, detect water events, and control valves - all from your phone.',
    position: 'center',
  },
  {
    title: 'Go to Systems',
    body: 'Tap the Systems tab below to browse your accounts, locations, and devices.',
    position: 'above-tabbar',
  },
];

// ─── Systems phase steps ────────────────────────────────────────────────────

const SYSTEMS_STEPS = [
  {
    title: 'Open Navigation',
    body: 'Tap the menu icon or swipe from the left edge to open the navigation panel.',
    position: 'below-menu',
    openDrawer: false,
  },
  {
    title: 'Your Location Path',
    body: 'This shows where you are in the hierarchy. Tap any level to jump back.',
    position: 'below-breadcrumb',
    openDrawer: true,
  },
  {
    title: 'Tap to Drill Down',
    body: 'Tap any tile to go deeper — accounts, countries, regions, cities, buildings.',
    position: 'center-drawer',
    openDrawer: true,
  },
  {
    title: 'Tap "View" to See Data',
    body: 'Tap the View button on a tile to load its dashboard and system list.',
    position: 'center-drawer',
    openDrawer: true,
  },
  {
    title: 'Overview & Systems',
    body: 'Swipe or tap to switch between the Overview dashboard and the full Systems list.',
    position: 'below-tabs',
    openDrawer: false,
  },
  {
    title: 'You\'re all set!',
    body: 'Explore your systems, check alerts, and manage everything from here.',
    position: 'center',
    openDrawer: false,
  },
];

// ─── Arrow ──────────────────────────────────────────────────────────────────

function Arrow({ direction }) {
  const w = 20, h = 10;
  if (direction === 'down') {
    return <svg width={w} height={h} style={{ display: 'block' }}><polygon points={`0,0 ${w},0 ${w/2},${h}`} fill="#2B35AF" /></svg>;
  }
  return <svg width={w} height={h} style={{ display: 'block' }}><polygon points={`${w/2},0 0,${h} ${w},${h}`} fill="#2B35AF" /></svg>;
}

// ─── Tooltip card ───────────────────────────────────────────────────────────

function TooltipCard({ step, totalSteps, title, body, isLast, onNext, onSkip }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #12086F, #2B35AF)',
      borderRadius: 14, padding: '15px 16px', width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: '1px solid rgba(67,97,238,0.4)',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 15 }}>{body}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 5, height: 5, borderRadius: 3,
              background: i === step ? '#4CC9F0' : 'rgba(255,255,255,0.2)',
              transition: 'width 0.2s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span onClick={onSkip} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>Skip</span>
          <span onClick={onNext} style={{
            fontSize: 13, fontWeight: 700, color: '#12086F', cursor: 'pointer',
            background: '#4CC9F0', padding: '6px 16px', borderRadius: 8,
          }}>{isLast ? 'Got it!' : 'Next'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Home onboarding ────────────────────────────────────────────────────────

export function HomeOnboarding({ onDismiss, onGoToSystems }) {
  const [step, setStep] = useState(0);
  const s = HOME_STEPS[step];

  const finish = () => {
    sessionStorage.setItem('pulse2-onboard-phase', 'systems');
    onGoToSystems();
  };

  const skip = () => {
    sessionStorage.setItem('pulse2-onboarded', 'true');
    onDismiss();
  };

  const next = () => {
    if (step >= HOME_STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  const isCenter = s.position === 'center';
  const isAboveTab = s.position === 'above-tabbar';

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100 }} />
      <div style={{
        position: 'absolute', zIndex: 101,
        left: 16, right: 16,
        ...(isCenter ? { top: '30%' } : {}),
        ...(isAboveTab ? { bottom: 75 } : {}),
        display: 'flex', flexDirection: 'column', alignItems: isAboveTab ? 'center' : 'stretch',
      }}>
        <TooltipCard step={step} totalSteps={HOME_STEPS.length}
          title={s.title} body={s.body}
          isLast={step === HOME_STEPS.length - 1}
          onNext={next} onSkip={skip} />
        {isAboveTab && <Arrow direction="down" />}
      </div>
    </>
  );
}

// ─── Systems onboarding ─────────────────────────────────────────────────────

export function SystemsOnboarding({ onDismiss, drawerOpen, onOpenDrawer, onCloseDrawer }) {
  const [step, setStep] = useState(0);
  const s = SYSTEMS_STEPS[step];

  useEffect(() => {
    if (s.openDrawer && !drawerOpen) onOpenDrawer();
    if (s.openDrawer === false && drawerOpen) onCloseDrawer();
  }, [step]);

  const finish = () => {
    sessionStorage.setItem('pulse2-onboarded', 'true');
    if (drawerOpen) onCloseDrawer();
    onDismiss();
  };

  const skip = finish;
  const next = () => step >= SYSTEMS_STEPS.length - 1 ? finish() : setStep(step + 1);

  const posStyle = (() => {
    switch (s.position) {
      case 'below-menu': return { top: 52, left: 10, right: 40 };
      case 'below-tabs': return { top: 95, left: 16, right: 16 };
      case 'below-breadcrumb': return { top: 70, left: 10, right: 40 };
      case 'center-drawer': return { top: '30%', left: 10, right: 40 };
      case 'center': return { top: '28%', left: 16, right: 16 };
      default: return { top: 100, left: 16, right: 16 };
    }
  })();

  const showUpArrow = s.position === 'below-menu' || s.position === 'below-tabs' || s.position === 'below-breadcrumb';

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100 }} />
      <div style={{
        position: 'absolute', zIndex: 101, ...posStyle,
        display: 'flex', flexDirection: 'column',
        alignItems: s.position === 'below-menu' || s.position === 'below-breadcrumb' ? 'flex-start' : 'stretch',
      }}>
        {showUpArrow && <div style={{ marginLeft: s.position === 'below-menu' ? 16 : 'auto', marginRight: 'auto' }}><Arrow direction="up" /></div>}
        <TooltipCard step={step} totalSteps={SYSTEMS_STEPS.length}
          title={s.title} body={s.body}
          isLast={step === SYSTEMS_STEPS.length - 1}
          onNext={next} onSkip={skip} />
      </div>
    </>
  );
}
