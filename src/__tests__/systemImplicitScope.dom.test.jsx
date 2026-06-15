// @vitest-environment happy-dom
//
// Locked 2026-06-15: viewing /system/<id> implicitly scopes the user to
// that one system. Tapping Alerts (or any bottom tab) shows ONLY that
// system's data - not the parent location's, not the persona's full scope.
//
// Bug Rami reported: 'when a single system is selected the Alerts tab is
// not filtered on that system but shows location'. Caused by SystemDetail
// not setting selectedScope on mount; the previous location scope (set
// before drilling in) leaked through.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UserProvider, useUserContext } from '../context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';
import SystemDetail from '../screens/systems/SystemDetail';
import EventsScreen from '../screens/events/EventsScreen';
import HomeUnified from '../screens/home/HomeUnified';
import TabBar from '../components/TabBar';

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

let exposedCtx = null;
function ContextProbe() {
  exposedCtx = useUserContext();
  return null;
}

function renderApp(personaId, startRoute) {
  localStorage.setItem('pulse2-persona-id', personaId);
  return render(
    <MemoryRouter initialEntries={[startRoute]}>
      <ThemeProvider>
        <UserProvider>
          <ContextProbe />
          <Routes>
            <Route path="/" element={<div><HomeUnified /></div>} />
            <Route path="/alerts" element={<div><EventsScreen /></div>} />
            <Route path="/system/:systemId" element={<div><SystemDetail /></div>} />
          </Routes>
        </UserProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

function findTabButton(label) {
  const buttons = document.querySelectorAll('button');
  let last = null;
  for (const b of buttons) {
    const span = b.querySelector('span');
    if (span && span.textContent === label) last = b;
  }
  if (!last) throw new Error(`Tab button "${label}" not found`);
  return last;
}

describe('Viewing /system/<id> implicitly scopes Alerts (and Home) to that one system', () => {
  it('SystemDetail mount sets selectedScope to the single system', () => {
    renderApp('wint-admin', '/system/ct1');
    // After SystemDetail's mount effect runs, scope = single-system.
    expect(exposedCtx.selectedScope).toBeTruthy();
    expect(exposedCtx.selectedScope.levelType).toBe('system');
    expect(exposedCtx.selectedScope.systemIds).toEqual(['ct1']);
    expect(exposedCtx.selectedScope.systems).toHaveLength(1);
    expect(exposedCtx.selectedScope.systems[0].id).toBe('ct1');
  });

  it('System -> Alerts via bottom TabBar: Alerts is scoped to just that system', () => {
    renderApp('wint-admin', '/system/ct1');
    const ctxScopedSystemId = exposedCtx.selectedScope.systemIds[0];
    expect(ctxScopedSystemId).toBe('ct1');

    // Tap Alerts in the bottom TabBar.
    act(() => { findTabButton('Alerts').click(); });

    // Scope MUST still be the single system after navigation.
    expect(exposedCtx.selectedScope?.systemIds).toEqual(['ct1']);
    expect(exposedCtx.selectedScope?.levelType).toBe('system');
  });

  it('Switching between systems (different /system/<id>) updates the implicit scope', () => {
    // Start on system A.
    const { unmount } = renderApp('wint-admin', '/system/ct1');
    expect(exposedCtx.selectedScope.systemIds).toEqual(['ct1']);
    unmount();
    cleanup();

    // Start on a different system - scope re-derives.
    renderApp('wint-admin', '/system/dl_apt_sea_view');
    expect(exposedCtx.selectedScope.systemIds).toEqual(['dl_apt_sea_view']);
    expect(exposedCtx.selectedScope.systems[0].id).toBe('dl_apt_sea_view');
  });

  it('Header title on Alerts shows the system name (not the parent location)', () => {
    renderApp('wint-admin', '/system/ct1');
    const sysName = exposedCtx.selectedScope.name;
    expect(sysName).toBeTruthy();

    act(() => { findTabButton('Alerts').click(); });

    // The Alerts page header should show the system name as the page title.
    const matches = screen.queryAllByText(sysName, { exact: false });
    expect(matches.length).toBeGreaterThan(0);
  });
});
