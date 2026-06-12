// Drift guard: the sim-alert overlay logic must live in ONE place
// (applySimOverlay in src/data/systems.js). If a future change adds a
// second overlay site by hand, that surface drifts from the rest -
// which is exactly what caused the "Active Alerts list keeps showing
// after End of Leak" + "drawer powerOk wrong" bugs Rami hit during
// notification testing 2026-06-06.
//
// Pattern matched: anyone writing { ...sys, alert: sim } or similar
// outside applySimOverlay. Grep-based, same approach as
// screenSubscribes.test.js.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

// Files that ARE allowed to use the overlay primitives:
const ALLOWLIST = new Set([
  'src/data/systems.js',         // defines applySimOverlay
]);

function scanForBadOverlays(root) {
  const findings = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__') continue;
        walk(full);
        continue;
      }
      if (!entry.name.match(/\.(js|jsx)$/)) continue;
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;
      const src = fs.readFileSync(full, 'utf8');
      // Two patterns we care about:
      //   1. { ...sys, alert: sim }     - the overlay write
      //   2. { ...s, alert: sims[s.id] } - the same pattern from UserContext
      // Either should now go through applySimOverlay.
      const lines = src.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        // Match {...something, alert: <expression involving sim|sims>}
        if (/\{\s*\.\.\.[a-zA-Z_]\w*,\s*alert:\s*(sim|sims\[)/.test(line)) {
          findings.push({ file: rel, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  walk(path.join(root, 'src'));
  return findings;
}

describe('sim-alert overlay logic has a single source of truth (applySimOverlay)', () => {
  it('no file outside src/data/systems.js writes its own { ...sys, alert: sim } pattern', () => {
    const findings = scanForBadOverlays(REPO_ROOT);
    if (findings.length > 0) {
      const detail = findings.map(f => `  ${f.file}:${f.line}  ${f.text}`).join('\n');
      throw new Error(
        'Drift detected. The following files write their own overlay - use applySimOverlay() instead:\n' + detail
      );
    }
    expect(findings).toHaveLength(0);
  });
});
