// @vitest-environment happy-dom
//
// Locked 2026-06-15 (PRD 14 § 2.3 + PRD 03a "Ignored events are included"):
// The Home page Water Events strip (High Flow / Low Flow chip counts) and
// the Tenant property status dot both include ignored Water Events. An
// ignored event stays "active" on the property until the underlying flow
// actually stops — the user should still see their property/system as in an
// active Water Event state.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ignoreIncident } from '../data/ignoredIncidents';
import StatusWidgetsMobile from '../components/StatusWidgetsMobile';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
});

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <ThemeProvider>{children}</ThemeProvider>
    </MemoryRouter>
  );
}

// Helper: find the chip element whose label text matches and return its
// rendered count value (the 22 px bold number above the label).
function chipCount(labelText) {
  const labels = screen.getAllByText(labelText);
  // Each High/Low Flow label is inside a chip div containing both the count
  // and the label. Walk up to the chip wrapper.
  for (const label of labels) {
    const chip = label.parentElement;
    if (!chip) continue;
    const txt = chip.textContent || '';
    // chip.textContent is "<label><number>" e.g. "High Flow2".
    const match = txt.match(new RegExp(`^${labelText}(\\d+)$`));
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

describe('Home Water Events strip — ignored events stay counted', () => {
  it('counts an ignored High Flow event in the High Flow chip', () => {
    const systems = [
      { id: 's1', name: 'Office', alert: { type: 'leak-high' } },
      { id: 's2', name: 'Lobby',  alert: { type: 'leak-high' } },
    ];

    // Ignore one of the two High Flow systems.
    ignoreIncident('s1', { tag: 'Filling pool', ignoredBy: 'Test User' });

    render(
      <Wrapper><StatusWidgetsMobile systems={systems} alertsOnly /></Wrapper>
    );

    // Both High Flow systems should still count — chip shows "2", not "1".
    expect(chipCount('High Flow')).toBe(2);
  });

  it('counts an ignored Low Flow event in the Low Flow chip', () => {
    const systems = [
      { id: 's1', name: 'Office', alert: { type: 'leak-low' } },
    ];

    ignoreIncident('s1', { tag: 'Filling pool', ignoredBy: 'Test User' });

    render(
      <Wrapper><StatusWidgetsMobile systems={systems} alertsOnly /></Wrapper>
    );

    expect(chipCount('Low Flow')).toBe(1);
  });

  it('mixed: ignored High + non-ignored Low both count in their chips', () => {
    const systems = [
      { id: 's1', name: 'Office', alert: { type: 'leak-high' } },
      { id: 's2', name: 'Lobby',  alert: { type: 'leak-low' } },
    ];

    ignoreIncident('s1', { tag: 'Filling pool', ignoredBy: 'Test User' });

    render(
      <Wrapper><StatusWidgetsMobile systems={systems} alertsOnly /></Wrapper>
    );

    expect(chipCount('High Flow')).toBe(1);
    expect(chipCount('Low Flow')).toBe(1);
  });
});
