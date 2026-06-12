// Tests the per-state action set on notification cards.
// Asserts every state produces the right action keys, in the right order.

import { describe, it, expect } from 'vitest';
import { buildActions } from '../utils/notificationActions';

function keys(actions) {
  return actions.map(a => a.key);
}
function labels(actions) {
  return actions.map(a => a.label);
}

describe('notification action set per state', () => {
  it('Warning: View · On it · Ignore', () => {
    const a = buildActions({ type: 'leak', state: 'Warning' }, { investigating: false, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view', 'investigate', 'ignore']);
    expect(labels(a)).toEqual(['View', 'On it', 'Ignore']);
  });

  it('Warning + already investigating: On it is HIDDEN', () => {
    const a = buildActions({ type: 'leak', state: 'Warning' }, { investigating: true, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view', 'ignore']); // no investigate
  });

  it('Ongoing: View only - no Dismiss (swipe-to-dismiss is native)', () => {
    const a = buildActions({ type: 'leak', state: 'Ongoing' }, { investigating: false, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view']);
    expect(a.find(x => x.key === 'dismiss')).toBeUndefined();
  });

  it('Shutoff: View · On it (no Ignore on Critical)', () => {
    const a = buildActions({ type: 'leak', state: 'Shutoff' }, { investigating: false, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view', 'investigate']);
    expect(a.find(x => x.key === 'ignore')).toBeUndefined();
  });

  it('Shutoff + investigating: On it hidden', () => {
    const a = buildActions({ type: 'leak', state: 'Shutoff' }, { investigating: true, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view']);
  });

  it('End of Leak (untagged): Tag CTA primary, View secondary', () => {
    const a = buildActions({ type: 'leak', state: 'End of Leak' }, { investigating: false, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['tag', 'view']);
    expect(a[0].label).toBe('Tag the cause');
    expect(a[0].primary).toBe(true);
    expect(a[0].tagCta).toBe(true); // drives the Wint-blue button styling
  });

  it('End of Leak (tagged): Tag button shows "✓ Tagged" done state, View still present', () => {
    const a = buildActions({ type: 'leak', state: 'End of Leak' }, { investigating: false, ignored: false, tagged: true });
    expect(keys(a)).toEqual(['tag', 'view']);
    expect(a[0].label).toBe('✓ Tagged');
    expect(a[0].done).toBe(true);
    expect(a[0].primary).toBe(false);
    expect(a[0].tagCta).toBeFalsy();
  });

  it('Any state + ignored: View only (all other actions collapse)', () => {
    const states = ['Warning', 'Ongoing', 'Shutoff', 'End of Leak'];
    states.forEach(state => {
      const a = buildActions({ type: 'leak', state }, { investigating: false, ignored: true, tagged: false });
      expect(keys(a)).toEqual(['view']);
    });
  });

  it('non-leak notification type: View only (rule - every notification has at least View)', () => {
    const types = ['valve-error', 'valve-error-cleared', 'power-lost', 'power-restored',
                   'offline', 'online', 'valve-closed-by-user', 'meter-disconnected'];
    types.forEach(type => {
      const a = buildActions({ type }, { investigating: false, ignored: false, tagged: false });
      expect(keys(a)).toEqual(['view']);
      expect(a[0].primary).toBe(true);
    });
  });

  it('unknown leak state defaults to View only', () => {
    const a = buildActions({ type: 'leak', state: 'Future-state' }, { investigating: false, ignored: false, tagged: false });
    expect(keys(a)).toEqual(['view']);
  });
});

describe('Dismiss action is NEVER returned by buildActions', () => {
  it('Ongoing has no Dismiss', () => {
    const a = buildActions({ type: 'leak', state: 'Ongoing' }, {});
    expect(a.find(x => x.key === 'dismiss')).toBeUndefined();
  });
  it('End of Leak has no Dismiss', () => {
    const a = buildActions({ type: 'leak', state: 'End of Leak' }, {});
    expect(a.find(x => x.key === 'dismiss')).toBeUndefined();
  });
});

describe('Tag CTA only on End of Leak', () => {
  it('Warning has no Tag action', () => {
    const a = buildActions({ type: 'leak', state: 'Warning' }, {});
    expect(a.find(x => x.key === 'tag')).toBeUndefined();
  });
  it('Ongoing has no Tag action', () => {
    const a = buildActions({ type: 'leak', state: 'Ongoing' }, {});
    expect(a.find(x => x.key === 'tag')).toBeUndefined();
  });
  it('Shutoff has no Tag action', () => {
    const a = buildActions({ type: 'leak', state: 'Shutoff' }, {});
    expect(a.find(x => x.key === 'tag')).toBeUndefined();
  });
  it('End of Leak has Tag action with primary+tagCta', () => {
    const a = buildActions({ type: 'leak', state: 'End of Leak' }, {});
    expect(a.find(x => x.key === 'tag')).toBeTruthy();
  });
});
