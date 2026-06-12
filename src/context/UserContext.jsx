import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SYSTEMS, applySimOverlay } from '../data/systems';
import { DEFAULT_PERSONA, getPersonaById } from '../data/personas';
import { getSimulatedAlerts } from '../data/simulatedAlerts';

const UserContext = createContext(null);
const PERSONA_KEY = 'pulse2-persona-id';

function loadPersona() {
  try {
    const id = localStorage.getItem(PERSONA_KEY);
    if (id) return getPersonaById(id) || DEFAULT_PERSONA;
  } catch { /* ignore */ }
  return DEFAULT_PERSONA;
}

export function UserProvider({ children }) {
  const [persona, setPersonaState] = useState(loadPersona);
  const [exploring, setExploring] = useState(false);
  // The drill-down selection from the navigation drawer.
  // Shape: { id, name, levelType, ancestors: string[], systems: [...] } | null
  const [selectedScope, setSelectedScope] = useState(null);

  // Persist persona so the simulator (separate route, mounted outside this
  // provider) sees the same scope, and so reloads don't reset it.
  const setPersona = useCallback((p) => {
    setPersonaState(p);
    try {
      if (p?.id) localStorage.setItem(PERSONA_KEY, p.id);
      else localStorage.removeItem(PERSONA_KEY);
    } catch { /* ignore */ }
  }, []);

  // Cross-tab sync: when another tab changes the persona we follow.
  // Also bump a `tick` on ANY pulse2-* storage write so visibleSystems
  // (computed below) re-derives with fresh sim-alert overlays. Without this,
  // a Warning push fired from another tab updates localStorage but the
  // provider's value object stays the same - Home + drawer stay stale.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PERSONA_KEY) setPersonaState(loadPersona());
      if (!e.key || e.key.startsWith('pulse2-')) setTick(t => t + 1);
    };
    window.addEventListener('storage', onStorage);
    // Same-tab pushes: the sender broadcasts 'data-changed' over the channel.
    const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pulse2-push') : null;
    const onMsg = (ev) => {
      if (ev?.data?.type === 'data-changed' || ev?.data?.type === 'push' || ev?.data?.type === 'demo-reset') {
        setTick(t => t + 1);
      }
    };
    ch?.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.removeEventListener('message', onMsg);
      ch?.close?.();
    };
  }, []);
  // eslint-disable-next-line no-unused-vars
  const _tick = tick; // referenced to keep the dep chain honest

  // Apply the simulated-alert overlay to every system, so Home / drawer /
  // every consumer sees fresh state when the pusher fires. Without this,
  // visibleSystems is computed from raw SYSTEMS once - stale forever.
  //
  // Uses applySimOverlay so this logic stays in sync with getSystemById +
  // computeActiveEvents. Three call sites historically drifted - centralized.
  const sims = getSimulatedAlerts();
  const SYSTEMS_OVERLAID = SYSTEMS.map(s => applySimOverlay(s, sims[s.id]));

  const visibleSystems = persona
    ? SYSTEMS_OVERLAID.filter(s => persona.systemFilter(s))
    : [];

  // When exploring, Systems screen shows all; Home always shows scope
  const exploreSystems = exploring ? SYSTEMS_OVERLAID : visibleSystems;

  const toggleExplore = useCallback(() => setExploring(v => !v), []);
  const clearSelectedScope = useCallback(() => setSelectedScope(null), []);

  return (
    <UserContext.Provider value={{
      persona, setPersona,
      visibleSystems,    // always scoped (for Home, notifications)
      exploreSystems,    // all systems when exploring (for Systems screen)
      exploring,
      toggleExplore,
      selectedScope,
      setSelectedScope,
      clearSelectedScope,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
