// Tests for the Timeline event classifier. The "high-flow mislabeled as
// low-flow" bug Rami hit went undetected because the data layer was right -
// the bug was in this classifier. These tests assert the exact title +
// category produced for each event type, covering both static (cached) and
// sim-pusher event shapes.

import { describe, it, expect } from 'vitest';
import { classify, CAT, C_HIGH, C_LOW, C_VALVE, C_POWER, C_CONN } from '../utils/classifyEvent';

// ─── The critical regression: high-flow mistakenly classified as low ───────

describe('low/high flow detection — the bug that shipped', () => {
  it('classifies "High-flow Water Event detected" as HIGH (was the bug: matched as low)', () => {
    const r = classify({ type: 'leak-detected', title: 'High-flow Water Event detected' });
    expect(r.title).toBe('High-flow Water Event detected');
    expect(r.color).toBe(C_HIGH);
    expect(r.cat).toBe(CAT.water);
  });

  it('classifies "Low-flow Water Event detected" as LOW', () => {
    const r = classify({ type: 'leak-detected', title: 'Low-flow Water Event detected' });
    expect(r.title).toBe('Low-flow Water Event detected');
    expect(r.color).toBe(C_LOW);
  });

  it('classifies static title "Leak — High flow detected" as HIGH', () => {
    const r = classify({ type: 'leak-detected', title: 'Leak — High flow detected' });
    expect(r.color).toBe(C_HIGH);
    expect(r.title).toBe('High-flow Water Event detected');
  });

  it('classifies static title "Leak — Low flow detected" as LOW', () => {
    const r = classify({ type: 'leak-detected', title: 'Leak — Low flow detected' });
    expect(r.color).toBe(C_LOW);
    expect(r.title).toBe('Low-flow Water Event detected');
  });

  it('does not mis-classify the word "flow" alone as low', () => {
    const r = classify({ type: 'leak-detected', title: 'Water flow detected on system X' });
    expect(r.color).toBe(C_HIGH); // default when no 'low flow' phrase
  });

  it('handles "Low flow" (space) and "Low-flow" (hyphen) the same', () => {
    const a = classify({ type: 'leak-detected', title: 'Low flow event' });
    const b = classify({ type: 'leak-detected', title: 'Low-flow event' });
    expect(a.color).toBe(C_LOW);
    expect(b.color).toBe(C_LOW);
  });
});

// ─── leak-resolved — same flow-detection logic ─────────────────────────────

describe('leak-resolved high vs low', () => {
  it('high-flow ended: title and color correct', () => {
    const r = classify({ type: 'leak-resolved', title: 'High-flow Water Event detected' });
    expect(r.title).toBe('High-flow event ended');
    expect(r.color).toBe(C_HIGH);
    expect(r.resolved).toBe(true);
  });

  it('low-flow ended: title and color correct', () => {
    const r = classify({ type: 'leak-resolved', title: 'Low-flow Water Event detected' });
    expect(r.title).toBe('Low-flow event ended');
    expect(r.color).toBe(C_LOW);
    expect(r.resolved).toBe(true);
  });
});

// ─── Ongoing reminders use fixed types per severity ─────────────────────────

describe('ongoing reminders', () => {
  it('leak-high renders Ongoing high-flow reminder', () => {
    const r = classify({ type: 'leak-high', detail: '42 L used so far' });
    expect(r.title).toBe('Ongoing high-flow reminder');
    expect(r.color).toBe(C_HIGH);
    expect(r.cat).toBe(CAT.water);
    expect(r.sub).toBe('42 L used so far');
  });

  it('leak-low renders Ongoing low-flow reminder', () => {
    const r = classify({ type: 'leak-low', detail: '' });
    expect(r.title).toBe('Ongoing low-flow reminder');
    expect(r.color).toBe(C_LOW);
  });
});

// ─── Valve / Power / Connectivity ──────────────────────────────────────────

describe('non-water event types', () => {
  it('valve-opened by user shows "By <actor>" in sub', () => {
    const r = classify({ type: 'valve-opened', actor: 'Maya Tal' });
    expect(r.title).toBe('Valve opened');
    expect(r.sub).toBe('By Maya Tal');
    expect(r.cat).toBe(CAT.valve);
  });

  it('valve-closed by System shows detail (no By line)', () => {
    const r = classify({ type: 'valve-closed', actor: 'System', detail: 'Auto-shutoff' });
    expect(r.sub).toBe('Auto-shutoff');
  });

  it('valve-error', () => {
    const r = classify({ type: 'valve-error' });
    expect(r.title).toBe('Valve error detected');
    // Per Icon Bank locked design (event-timeline-prd.html §2a):
    // valve glyph anchors every valve state; error is the badge.
    expect(r.color).toBe(C_HIGH);
    expect(r.icon).toBe('valve');
    expect(r.badge).toBe('error');
  });

  it('power-lost', () => {
    const r = classify({ type: 'power-lost' });
    expect(r.title).toBe('External power disconnected');
    expect(r.color).toBe(C_POWER);
  });

  it('power-restored', () => {
    const r = classify({ type: 'power-restored' });
    expect(r.title).toBe('External power reconnected');
    expect(r.resolved).toBe(true);
  });

  it('device-offline', () => {
    const r = classify({ type: 'device-offline' });
    expect(r.title).toBe('System offline');
    expect(r.color).toBe(C_CONN);
  });

  it('device-online', () => {
    const r = classify({ type: 'device-online' });
    expect(r.title).toBe('System communication resumed');
    expect(r.resolved).toBe(true);
  });
});

// ─── Sim-generated lifecycle event types ──────────────────────────────────
// These are emitted by the pusher (via applyPushEvent -> sim alert events log
// -> lifeEvents). Each must have its own classify case OR classify will
// rewrite the title to a generic value. The bug Rami hit was that Shutoff
// pushes were showing as 'High-flow Water Event detected' because they
// remapped to 'leak-detected' which rewrites the title.

describe('sim lifecycle event types render with the right titles', () => {
  it('leak-detected-high keeps "High-flow Water Event detected"', () => {
    const r = classify({ type: 'leak-detected-high' });
    expect(r.title).toBe('High-flow Water Event detected');
    expect(r.cat).toBe(CAT.water);
    expect(r.color).toBe(C_HIGH);
  });

  it('leak-detected-low keeps "Low-flow Water Event detected"', () => {
    const r = classify({ type: 'leak-detected-low' });
    expect(r.title).toBe('Low-flow Water Event detected');
    expect(r.color).toBe(C_LOW);
  });

  it('leak-ongoing renders "Ongoing reminder fired" (not a generic leak title)', () => {
    const r = classify({ type: 'leak-ongoing', detail: 'Volume 42 L' });
    expect(r.title).toBe('Ongoing reminder fired');
    expect(r.cat).toBe(CAT.water);
    expect(r.sub).toBe('Volume 42 L');
  });

  it('leak-shutoff renders "Shutoff level reached" — the bug Rami hit', () => {
    const r = classify({ type: 'leak-shutoff', detail: 'Volume 80 L' });
    expect(r.title).toBe('Shutoff level reached');
    expect(r.cat).toBe(CAT.water);
    expect(r.sub).toBe('Volume 80 L');
  });

  it('valve-closing-we renders "Valve started closing" under water category', () => {
    const r = classify({ type: 'valve-closing-we', detail: 'Auto-shutoff in progress.' });
    expect(r.title).toBe('Valve started closing');
    expect(r.cat).toBe(CAT.water); // NOT valve — this is a water-event sub-state
  });

  it('valve-closed-we renders "Valve closed successfully" under water category', () => {
    const r = classify({ type: 'valve-closed-we', detail: 'Water flow stopped.' });
    expect(r.title).toBe('Valve closed successfully');
    expect(r.cat).toBe(CAT.water);
  });

  it('leak-resolved-we (sim Water Event ended) renders "Water Event ended"', () => {
    const r = classify({ type: 'leak-resolved-we', detail: 'Total 86 L' });
    expect(r.title).toBe('Water Event ended');
    expect(r.resolved).toBe(true);
  });

  it('the 6 lifecycle pushes each produce a UNIQUE title', () => {
    const titles = [
      classify({ type: 'leak-detected-high' }).title,
      classify({ type: 'leak-ongoing' }).title,
      classify({ type: 'leak-shutoff' }).title,
      classify({ type: 'valve-closing-we' }).title,
      classify({ type: 'valve-closed-we' }).title,
      classify({ type: 'leak-resolved-we' }).title,
    ];
    expect(new Set(titles).size).toBe(6); // no duplicates - all distinct
  });

  it('the 6 lifecycle pushes use 2 glyphs (water_drop + valve) per Icon Bank', () => {
    // Water lifecycle ALL uses water_drop (color carries phase).
    // Valve actions use the `valve` glyph (matches Valve widget).
    const icons = [
      classify({ type: 'leak-detected-high' }).icon,
      classify({ type: 'leak-ongoing' }).icon,
      classify({ type: 'leak-shutoff' }).icon,
      classify({ type: 'valve-closing-we' }).icon,
      classify({ type: 'valve-closed-we' }).icon,
      classify({ type: 'leak-resolved-we' }).icon,
    ];
    expect(new Set(icons)).toEqual(new Set(['water_drop', 'valve']));
  });

  it('each specific lifecycle event renders the canonical Icon Bank glyph', () => {
    expect(classify({ type: 'leak-detected-high' }).icon).toBe('water_drop');
    expect(classify({ type: 'leak-detected-low' }).icon).toBe('water_drop');
    expect(classify({ type: 'leak-ongoing' }).icon).toBe('water_drop');
    expect(classify({ type: 'leak-shutoff' }).icon).toBe('water_drop');
    expect(classify({ type: 'valve-closing-we' }).icon).toBe('valve');
    expect(classify({ type: 'valve-closed-we' }).icon).toBe('valve');
    expect(classify({ type: 'leak-resolved-we' }).icon).toBe('water_drop');
  });
});

// ─── Safety ───────────────────────────────────────────────────────────────

describe('unknown / malformed input', () => {
  it('null input returns null', () => {
    expect(classify(null)).toBeNull();
    expect(classify(undefined)).toBeNull();
  });

  it('unknown type returns null', () => {
    expect(classify({ type: 'some-future-thing' })).toBeNull();
  });

  it('missing title is treated as empty string (no low-flow false-positive)', () => {
    const r = classify({ type: 'leak-detected' });
    expect(r.color).toBe(C_HIGH);
  });
});
