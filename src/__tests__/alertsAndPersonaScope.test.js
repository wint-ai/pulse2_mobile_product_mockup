// Verifies that sim alerts make it into:
//   - the Alerts screen (computeActiveEvents)
//   - the persona's scope filter (visibleSystems)
//   - the System overlay (getSystemById)
//
// And that they DON'T leak across personas.

import { describe, it, expect, beforeEach } from 'vitest';

function makeStorageStub() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
    clear: () => { data.clear(); },
    key: (i) => Array.from(data.keys())[i] || null,
    get length() { return data.size; },
  };
}
globalThis.localStorage = makeStorageStub();

const { applyPushEvent } = await import('../lib/pushEvents.js');
const { computeActiveEvents } = await import('../data/events.js');
const { SYSTEMS } = await import('../data/systems.js');
const { PERSONAS } = await import('../data/personas.js');

beforeEach(() => {
  globalThis.localStorage = makeStorageStub();
});

const SEA_VIEW = 'dl_apt_sea_view';     // Maya Tal's
const APT_47   = 'tidhar_apt_47';       // Sarah Cohen's + Oren Tidhar's
const CT1      = 'ct1';                  // James Lee's

describe('/alerts screen reflects sim alerts', () => {
  it('after a Warning push, computeActiveEvents includes it', () => {
    const before = computeActiveEvents().filter(e => e.system === SEA_VIEW || e.systemId === SEA_VIEW);
    applyPushEvent({
      type: 'push',
      payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: SEA_VIEW,
                 flowRate: '99 L/min', volume: '5 L' },
    });
    const after = computeActiveEvents().filter(e => (e.system || e.systemId) === SEA_VIEW);
    // At least one event for Sea View now
    expect(after.length).toBeGreaterThan(0);
    // It's a high-flow leak event
    const leakEvent = after.find(e => e.type === 'leak-high');
    expect(leakEvent).toBeTruthy();
  });

  it('after firing on two systems, both events present in /alerts', () => {
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: SEA_VIEW } });
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'Low Flow',  systemId: APT_47 } });
    const events = computeActiveEvents();
    expect(events.find(e => (e.system || e.systemId) === SEA_VIEW && e.type === 'leak-high')).toBeTruthy();
    expect(events.find(e => (e.system || e.systemId) === APT_47   && e.type === 'leak-low')).toBeTruthy();
  });

  it('clearing a sim alert removes it from /alerts', () => {
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: SEA_VIEW } });
    expect(computeActiveEvents().some(e => (e.system || e.systemId) === SEA_VIEW && e.type === 'leak-high')).toBe(true);
    // online closure clears
    applyPushEvent({ type: 'push', payload: { type: 'online', systemId: SEA_VIEW } });
    expect(computeActiveEvents().some(e => (e.system || e.systemId) === SEA_VIEW && e.type === 'leak-high')).toBe(false);
  });
});

describe('persona scope filtering', () => {
  it('Maya Tal sees Sea View + Leumi Tower only', () => {
    const maya = PERSONAS.find(p => p.id === 'tenant-2apts');
    const visible = SYSTEMS.filter(maya.systemFilter).map(s => s.id);
    expect(visible).toContain('dl_apt_sea_view');
    expect(visible).toContain('dl_apt_leumi_tower');
    expect(visible).not.toContain('ct1');
    expect(visible).not.toContain('tidhar_apt_47');
  });

  it('Sarah Cohen sees ONLY her one Tidhar apartment', () => {
    const sarah = PERSONAS.find(p => p.id === 'tenant-1apt');
    const visible = SYSTEMS.filter(sarah.systemFilter).map(s => s.id);
    expect(visible).toEqual(['tidhar_apt_47']);
  });

  it('Oren Tidhar sees Tidhar Towers apartments', () => {
    const oren = PERSONAS.find(p => p.id === 'building-manager-residential');
    const visible = SYSTEMS.filter(oren.systemFilter).map(s => s.id);
    expect(visible.length).toBeGreaterThan(50); // ~200 apartments
    expect(visible).toContain('tidhar_apt_47');
    expect(visible.every(id => id.startsWith('tidhar_apt_'))).toBe(true);
  });

  it('a sim alert on CT1 is NOT visible to Maya Tal (out of scope)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: 'ct1' } });
    const maya = PERSONAS.find(p => p.id === 'tenant-2apts');
    const visible = SYSTEMS.filter(maya.systemFilter).map(s => s.id);
    expect(visible).not.toContain('ct1');
    // Maya's surface (her visibleSystems) does not include CT1
    // even though there's a sim alert on it.
  });

  it('a sim alert on Apt 47 IS visible to both Sarah (tenant) and Oren (building manager)', () => {
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: APT_47 } });
    const sarah = PERSONAS.find(p => p.id === 'tenant-1apt');
    const oren  = PERSONAS.find(p => p.id === 'building-manager-residential');
    expect(SYSTEMS.filter(sarah.systemFilter).map(s => s.id)).toContain(APT_47);
    expect(SYSTEMS.filter(oren.systemFilter).map(s => s.id)).toContain(APT_47);
  });
});

describe('static + sim alert on same system', () => {
  it('Sea View has a static low-flow alert; sim Warning overrides to high-flow', () => {
    // Static alert (in mock data) is leak-low. After sim Warning fires
    // High Flow, getSystemById should return high-flow.
    applyPushEvent({ type: 'push', payload: { type: 'leak', state: 'Warning', severity: 'High Flow', systemId: SEA_VIEW } });
    const sys = SYSTEMS.find(s => s.id === SEA_VIEW);
    expect(sys.alert.type).toBe('leak-low'); // static still says low
    // (the overlay is applied by getSystemById, not on the raw SYSTEMS array)
    // Verify via getSystemById:
    return import('../data/systems.js').then(m => {
      const overlaid = m.getSystemById(SEA_VIEW);
      expect(overlaid.alert.type).toBe('leak-high'); // sim wins
    });
  });
});
