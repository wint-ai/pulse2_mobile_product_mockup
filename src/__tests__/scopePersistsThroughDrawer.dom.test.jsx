// @vitest-environment happy-dom
//
// REAL user flow - clicks an actual location row in the drawer, NOT a
// programmatic setSelectedScope. This is what Rami was actually doing
// when he reported the bug: open drawer on Home, tap a location, then
// tap Alerts in the bottom TabBar.
//
// If this test passes but production still fails, the bug is outside
// React state (service worker, stale bundle, persona-specific data, etc.).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UserProvider, useUserContext } from '../context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';
import HomeUnified from '../screens/home/HomeUnified';
import EventsScreen from '../screens/events/EventsScreen';
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

function renderApp(personaId, startRoute = '/') {
  localStorage.setItem('pulse2-persona-id', personaId);
  return render(
    <MemoryRouter initialEntries={[startRoute]}>
      <ThemeProvider>
        <UserProvider>
          <ContextProbe />
          <Routes>
            <Route path="/" element={<div><HomeUnified /></div>} />
            <Route path="/alerts" element={<div><EventsScreen /></div>} />
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

function clickDrawerBadge() {
  // The drawer-trigger badge has role="button" + aria-label="Switch location".
  const triggers = document.querySelectorAll('[aria-label="Switch location"]');
  const trigger = triggers[triggers.length - 1];
  if (!trigger) throw new Error('Drawer trigger not found');
  act(() => { trigger.click(); });
}

function findFirstAccountCardHeader() {
  // AccountCard's header is the div with role="button" + aria-expanded.
  // Skip drawer-search; it's also role=button on input wrapper. Specifically
  // we look for role=button with aria-expanded attr - that's AccountCard.
  const headers = document.querySelectorAll('[role="button"][aria-expanded]');
  return headers[0];
}

describe('REAL flow: drawer click → scope persists into Alerts tab', () => {
  // Run across several personas so we cover the requirement that scope
  // behavior is the same for every demo user.
  const PERSONAS = [
    'wint-admin',                       // 4-account manager
    'building-manager-residential',     // single-building manager (Oren)
    'location-manager-1building',       // (Mark)
    'account-manager-suffolk',          // (James)
    'account-manager-cbre',             // multi-region (Rachel)
  ];

  PERSONAS.forEach(personaId => {
    it(`[${personaId}] picking a location on Home then tapping Alerts shows the same scope`, () => {
      renderApp(personaId, '/');

      // No scope yet.
      expect(exposedCtx.selectedScope).toBeFalsy();

      // Open drawer.
      clickDrawerBadge();

      // Find the first AccountCard header and tap it. That commits the
      // account as the scope and closes the drawer.
      const acctHeader = findFirstAccountCardHeader();
      expect(acctHeader).toBeDefined();
      act(() => { acctHeader.click(); });

      // After the click, the global scope is set.
      expect(exposedCtx.selectedScope).toBeTruthy();
      const pickedName = exposedCtx.selectedScope.name;
      expect(pickedName).toBeTruthy();

      // Now tap Alerts in the bottom TabBar.
      act(() => { findTabButton('Alerts').click(); });

      // The scope MUST still be set with the same name.
      expect(exposedCtx.selectedScope?.name).toBe(pickedName);

      // And the Alerts page should be showing that name in its header.
      const visibleMatches = screen.queryAllByText(pickedName, { exact: false });
      expect(visibleMatches.length).toBeGreaterThan(0);
    });
  });
});
