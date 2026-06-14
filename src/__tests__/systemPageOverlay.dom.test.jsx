// @vitest-environment happy-dom
//
// Renders the small System-page components (StatusPills / AlertBanner) with
// sim alert state varying. Catches the bug class "I fired X, sim alert
// flipped correctly, but the rendered DOM still shows the old state" -
// which is what Rami hit when AC Power Lost showed in the timeline but
// didn't appear on the system page.
//
// AllClear component was removed from SystemDetail.jsx on 2026-06-13 (the
// "All Clear" framing was misleading when the Health widget below showed
// issues - the Water Event widget now handles its own empty state with
// "No active Water Events"). Tests that exercised that component were
// removed in the same pass.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { StatusPills, AlertBanner } from '../screens/systems/SystemDetail';
import { applyPushEvent } from '../lib/pushEvents';
import { getSystemById } from '../data/systems';

const SYS_ID = 'dl_apt_sea_view';

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

// Theme harness - StatusPills/AlertBanner take theme as a prop.
function withTheme(Comp) {
  function Wrapped(props) {
    const { theme } = useTheme();
    return <Comp {...props} theme={theme} />;
  }
  return Wrapped;
}

function renderWithTheme(node) {
  return render(
    <MemoryRouter>
      <ThemeProvider>{node}</ThemeProvider>
    </MemoryRouter>
  );
}

const StatusPillsThemed = withTheme(StatusPills);
const AlertBannerThemed = withTheme(AlertBanner);

// ─── StatusPills reflects sys.power / sys.comm overlay from sim pushes ────

describe('StatusPills DOM reflects sim push overlays', () => {
  it('No push: Power pill shows "AC"', () => {
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.queryByText('AC Lost')).toBeNull();
  });

  it('power-lost push: Power pill shows "AC Lost"', () => {
    applyPushEvent({ type: 'push', payload: { type: 'power-lost', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('AC Lost')).toBeInTheDocument();
    expect(screen.queryByText('AC')).toBeNull();
  });

  it('power-restored push after power-lost: Power pill back to "AC"', () => {
    applyPushEvent({ type: 'push', payload: { type: 'power-lost',     systemId: SYS_ID } });
    applyPushEvent({ type: 'push', payload: { type: 'power-restored', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.queryByText('AC Lost')).toBeNull();
  });

  it('offline push: Comm pill shows "Offline"', () => {
    applyPushEvent({ type: 'push', payload: { type: 'offline', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText('Online')).toBeNull();
  });

  it('online closure after offline: Comm pill back to "Online"', () => {
    applyPushEvent({ type: 'push', payload: { type: 'offline', systemId: SYS_ID } });
    applyPushEvent({ type: 'push', payload: { type: 'online',  systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).toBeNull();
  });
});

// ─── AlertBanner: water-event only, suppressed for non-water types ────────

describe('AlertBanner shows for leak alerts and only leak alerts', () => {
  it('water Warning: AlertBanner renders something (it has alert content)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: SYS_ID, flowRate: '22.5 L/min', volume: '18 L' } });
    const sys = getSystemById(SYS_ID);
    const { container } = renderWithTheme(<AlertBannerThemed sys={sys} navigate={() => {}} />);
    // The banner is a LeakSummary + View details link
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('valve-error push: AlertBanner returns null (Protection Status shows it instead)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'valve-error', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    const { container } = renderWithTheme(<AlertBannerThemed sys={sys} navigate={() => {}} />);
    expect(container.textContent).toBe('');
  });

  it('power-lost push: AlertBanner returns null (Protection Status + StatusPills show it)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'power-lost', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    const { container } = renderWithTheme(<AlertBannerThemed sys={sys} navigate={() => {}} />);
    expect(container.textContent).toBe('');
  });

  it('offline push: AlertBanner returns null', () => {
    applyPushEvent({ type: 'push', payload: { type: 'offline', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    const { container } = renderWithTheme(<AlertBannerThemed sys={sys} navigate={() => {}} />);
    expect(container.textContent).toBe('');
  });
});

// ─── Cross-category: System page reflects EACH active sim alert correctly ─

describe('System page DOM reflects each non-water push correctly', () => {
  it('power-lost: StatusPills shows AC Lost', () => {
    applyPushEvent({ type: 'push', payload: { type: 'power-lost', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('AC Lost')).toBeInTheDocument();
  });

  it('offline: StatusPills shows Offline (Power pill hidden because comm offline)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'offline', systemId: SYS_ID } });
    const sys = getSystemById(SYS_ID);
    renderWithTheme(<StatusPillsThemed sys={sys} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    // Power pill is conditional on comm===online so it's hidden in this case
    expect(screen.queryByText('AC')).toBeNull();
    expect(screen.queryByText('AC Lost')).toBeNull();
  });
});
