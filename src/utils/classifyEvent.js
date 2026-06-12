// Classify a raw life-event row into the locked Timeline shape.
//
// Pure function: in → out. No React, no state. Extracted from ActivityTab so
// it can be unit-tested independently and so regressions like 'High-flow gets
// labeled as Low-flow because /low/ matches "flow"' surface in `npm test`
// instead of in production.

// Locked per-category palette (PRD 1541898241 · Event Timeline)
export const C_HIGH  = '#DB4670';   // Water Events · High Flow
export const C_LOW   = '#F05C25';   // Water Events · Low Flow
export const C_VALVE = '#036AB5';   // Valve
export const C_POWER = '#B5651A';   // Power
export const C_CONN  = '#717684';   // Connectivity

export const CAT = { water: 'water', valve: 'valve', power: 'power', conn: 'conn' };

// Detect low-flow from the event title. The phrase 'low flow' / 'low-flow'
// must appear; the naive /low/ matched 'flow' as a substring and mislabeled
// every high-flow event as low.
function isLowFlow(title) {
  return /low[\s-]flow/i.test(title || '');
}

export function classify(ev) {
  if (!ev) return null;
  const t = ev.type;
  const title = ev.title || '';
  const low = isLowFlow(title);
  switch (t) {
    case 'leak-detected':  return { cat: CAT.water,  color: low ? C_LOW : C_HIGH, icon: 'water_drop', filled: true,
                                    title: low ? 'Low-flow Water Event detected'  : 'High-flow Water Event detected',
                                    sub: ev.detail };
    // Sim-generated lifecycle events. Icons per Rami 2026-06-06:
    //   - Detected / Ongoing / Shutoff / Ended ALL -> water_drop
    //     (color carries phase: high=red, low=orange, ended=green)
    //   - Valve actions -> `valve` (literal valve drawing, same as widget).
    //     Color carries open vs closed state.
    case 'leak-detected-high': return { cat: CAT.water, color: C_HIGH, icon: 'water_drop', filled: true,
                                    title: 'High-flow Water Event detected', sub: ev.detail };
    case 'leak-detected-low':  return { cat: CAT.water, color: C_LOW,  icon: 'water_drop', filled: true,
                                    title: 'Low-flow Water Event detected',  sub: ev.detail };
    case 'leak-ongoing':       return { cat: CAT.water, color: C_HIGH, icon: 'water_drop', filled: true,
                                    title: 'Ongoing reminder fired', sub: ev.detail };
    case 'leak-shutoff':       return { cat: CAT.water, color: C_HIGH, icon: 'water_drop', filled: true,
                                    title: 'Shutoff level reached', sub: ev.detail };
    case 'valve-closing-we':   return { cat: CAT.water, color: '#717684', icon: 'valve', filled: true,
                                    title: 'Valve started closing', sub: ev.detail };
    case 'valve-closed-we':    return { cat: CAT.water, color: '#717684', icon: 'valve', filled: true,
                                    badge: 'lock',  // closed is closed - same as manual close
                                    title: 'Valve closed successfully', sub: ev.detail };
    case 'leak-resolved-we':   return { cat: CAT.water, color: '#5C9E1A', icon: 'water_drop', filled: true,
                                    resolved: true,
                                    title: 'Water Event ended', sub: ev.detail };
    case 'leak-high':      return { cat: CAT.water,  color: C_HIGH, icon: 'water_drop', filled: true,
                                    title: 'Ongoing high-flow reminder', sub: ev.detail };
    case 'leak-low':       return { cat: CAT.water,  color: C_LOW,  icon: 'water_drop', filled: true,
                                    title: 'Ongoing low-flow reminder', sub: ev.detail };
    case 'leak-resolved':  return { cat: CAT.water,  color: low ? C_LOW : C_HIGH, icon: 'water_drop', filled: true,
                                    resolved: true,
                                    title: low ? 'Low-flow event ended' : 'High-flow event ended',
                                    sub: ev.detail };
    // Non-water lifecycle. Glyph + color per PRD 11 Appendix A:
    //   Valve opened -> lock_open / green   · Valve closed -> lock / gray (manual)
    //   Malfunction -> error / red          · Resolved -> check (outline) / green
    //   Power down/up -> bolt (brown / green when reconnected)
    //   Offline -> wifi_off (gray)          · Online -> wifi (green)
    // Valve events: always show the `valve` glyph as the category anchor.
    // State conveyed by background color + a small badge bottom-right:
    //   badge 'lock'  -> closed (sealed)
    //   badge 'error' -> error / malfunction (red ! marker)
    //   badge 'check' -> resolved / success (green V)
    case 'valve-opened':   return { cat: CAT.valve, color: '#5C9E1A', icon: 'valve', filled: true,
                                    title: 'Valve opened',
                                    sub: ev.actor && ev.actor !== 'System' ? `By ${ev.actor}` : ev.detail };
    case 'valve-closed':   return { cat: CAT.valve, color: '#717684', icon: 'valve', filled: true,
                                    badge: 'lock',
                                    title: 'Valve closed',
                                    sub: ev.actor && ev.actor !== 'System' ? `By ${ev.actor}` : ev.detail };
    case 'valve-error':    return { cat: CAT.valve, color: C_HIGH, icon: 'valve', filled: true,
                                    badge: 'error',
                                    title: 'Valve error detected',
                                    sub: ev.detail || 'Valve may not operate reliably' };
    case 'valve-resolved': return { cat: CAT.valve, color: '#5C9E1A', icon: 'valve', filled: true,
                                    badge: 'check',
                                    resolved: true,
                                    title: 'Valve malfunction resolved',
                                    sub: 'Normal operation resumed' };
    case 'power-lost':     return { cat: CAT.power, color: C_POWER, icon: 'bolt', filled: true,
                                    title: 'External power disconnected',
                                    sub: 'Running from backup battery. Power saving mode' };
    case 'power-restored': return { cat: CAT.power, color: '#5C9E1A', icon: 'bolt', filled: true,
                                    resolved: true,
                                    title: 'External power reconnected',
                                    sub: 'Normal operation resumed' };
    case 'device-offline': return { cat: CAT.conn,  color: C_CONN, icon: 'wifi_off', filled: false,
                                    title: 'System offline',
                                    sub: ev.detail || 'Lost communication with cloud' };
    case 'device-online':  return { cat: CAT.conn,  color: '#5C9E1A', icon: 'wifi', filled: true,
                                    resolved: true,
                                    title: 'System communication resumed',
                                    sub: 'Normal operation resumed' };
    // Sensors (V10.9 SEN_*): same base + badge convention as malfunctions.
    case 'valve-disconnected': return { cat: CAT.valve, color: C_HIGH, icon: 'valve', filled: true,
                                    badge: 'error',
                                    title: 'Valve disconnected',
                                    sub: ev.detail || 'Valve sensor offline' };
    case 'valve-reconnected':  return { cat: CAT.valve, color: '#5C9E1A', icon: 'valve', filled: true,
                                    badge: 'check',
                                    resolved: true,
                                    title: 'Valve reconnected', sub: ev.detail || 'Valve sensor back online' };
    // Meter has no valve-glyph equivalent; use water_drop (it measures water).
    case 'meter-disconnected': return { cat: CAT.conn,  color: C_HIGH, icon: 'water_drop', filled: true,
                                    badge: 'error',
                                    title: 'Meter disconnected', sub: ev.detail || 'Flow meter offline' };
    case 'meter-reconnected':  return { cat: CAT.conn,  color: '#5C9E1A', icon: 'water_drop', filled: true,
                                    badge: 'check',
                                    resolved: true,
                                    title: 'Meter reconnected', sub: ev.detail || 'Flow meter back online' };
    // VC_OK_01: valve closed by user (informational manual action, gray)
    case 'valve-closed-by-user': return { cat: CAT.valve, color: '#717684', icon: 'valve', filled: true,
                                    badge: 'lock',
                                    title: 'Valve closed by user', sub: ev.detail || 'Manual close action' };
    default: return null;
  }
}
