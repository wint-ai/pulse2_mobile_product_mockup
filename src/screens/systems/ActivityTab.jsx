// Event Timeline (System Activity)
// Renders the per-system feed of every event — water · valve · power ·
// connectivity. Matches the locked design at
//   public/reviews/event-timeline-activity.html
//
// Variant A row anatomy: [dot] [time / title / sub] [optional chevron].
// Vertical rail behind the dots. Per-category icons + colours locked.
// Resolution events (event ended · reconnected · resumed · resolved) keep
// the category dot and add a small green check badge.
// Always-show-date time format. Day-grouped sticky headers with counts.
// Infinite scroll on the way down (no Load-more button).
// Expandable panel reveals Notified (collapsed-by-default) + On it.

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLifeEventsForSystem } from '../../data/lifeEvents';
import { useTheme } from '../../context/ThemeContext';
import TagBottomSheet from '../../components/TagBottomSheet';
import { getTags, addTag, removeTagAt } from '../../data/tagsStore';
import { getCurrentActor } from '../../data/currentUser';
import { useDataRefresh } from '../../utils/useDataRefresh';
import { getSimulatedAlert } from '../../data/simulatedAlerts';
import { classify, C_HIGH, C_LOW, C_VALVE, C_POWER, C_CONN, CAT } from '../../utils/classifyEvent';

const C_OK    = '#5C9E1A';   // Resolution-state green check badge

// Same set + labels as the Alerts screen — one filter rail across the app.
// Short labels so 5 pills fit on a phone screen without horizontal scroll.
// "All" pill removed 2026-06-06 - it was a reset button disguised as a
// peer category, which hid the fact that the row is multi-select.
// Empty selection IS "show all"; the explicit reset lives in a "Clear x"
// chip that appears above the pill row only when filters are active.
// `labelKey` resolves via t(`timeline.filters.<key>`) inside the component.
const FILTERS = [
  { key: 'water', labelKey: 'water', color: C_HIGH  },
  { key: 'valve', labelKey: 'valve', color: C_VALVE },
  { key: 'power', labelKey: 'power', color: C_POWER },
  { key: 'conn',  labelKey: 'comms', color: C_CONN  },
];

// Months / parse helper — mock timestamps are "MMM D, HH:MM" strings,
// fixed year 2026 (matches lifeEvents.js baseDate Mar 25 2026).
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parseStamp(stamp) {
  if (!stamp) return { date: null, time: '', dateKey: '' };
  const [datePart, timePart] = stamp.split(',').map(s => s.trim());
  const [monthStr, dayStr] = datePart.split(' ');
  const month = MONTHS.indexOf(monthStr);
  const day = parseInt(dayStr, 10);
  if (month < 0 || !day) return { date: null, time: timePart || '', dateKey: datePart };
  const [hh, mm] = (timePart || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  const date = new Date(2026, month, day, hh, mm);
  return { date, time: timePart || '', dateKey: datePart };
}
// dateGroupLabel is called at render time; caller passes `t` from useTranslation.
function dateGroupLabel(dateKey, t) {
  // Mock "today" anchor at Mar 25 (matches lifeEvents baseDate).
  if (dateKey === 'Mar 25') return t('timeline.today');
  if (dateKey === 'Mar 24') return t('timeline.yesterday');
  return `${dateKey} 2026`;
}
function fullDateLabel(dateKey, time) {
  return `${dateKey}, 2026 · ${time}`;
}

// classify() moved to src/utils/classifyEvent.js so it can be unit-tested.

// ─── Small inline helpers ─────────────────────────────────────────────────
function MIcon({ name, size = 18, color, fill = true, style = {} }) {
  return <span className="material-symbols-outlined"
    style={{ fontSize: size, color, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", lineHeight: 1, ...style }}
  >{name}</span>;
}

// AVATAR_COLORS / initials() / hashStr() removed 2026-06-10 along with
// RecipientRow - the new method-led Notified layout doesn't render avatars
// or per-recipient destination strings (no fake phone numbers, no email
// fan-out display).

// ─── Main component ───────────────────────────────────────────────────────
export default function ActivityTab({ sys, focusEventId }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // Re-render this tab when the pusher mutates localStorage (sim alerts,
  // ignored, on-it, tags) - otherwise the cached useMemo never sees pusher
  // events appear in the timeline.
  useDataRefresh();
  // Multi-select filter set. Empty = "All" (show everything).
  const [activeFilters, setActiveFilters] = useState(() => new Set());
  // Water sub-filter — only meaningful when 'water' is in the set.
  const [waterSub, setWaterSub] = useState('all');
  function clearFilters() { setActiveFilters(new Set()); setWaterSub('all'); }
  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        if (key === 'water') setWaterSub('all');
      } else {
        next.add(key);
      }
      return next;
    });
  }
  // If deep-linked with ?event=<id>, pre-expand that row so the user lands on it.
  const [expandedIds, setExpandedIds] = useState(() => new Set(focusEventId ? [focusEventId] : []));
  const [notifiedExpanded, setNotifiedExpanded] = useState(() => new Set());

  // Retroactive tag bottom sheet — opens when user taps the chip pill on a
  // closing water-event row, or the Edit/Tag button inside the expanded panel.
  // tagSheetForId carries the event ID (NOT system ID) — closed-event tags
  // are keyed per-event per PRD 15 § 10.4 disclaimer in tagsStore.
  const [tagSheetForId, setTagSheetForId] = useState(null);
  const [tagBumper, setTagBumper] = useState(0);
  function openTagSheet(eventId) { setTagSheetForId(eventId); }
  function closeTagSheet() { setTagSheetForId(null); setTagBumper(b => b + 1); }

  // Scroll the focused event into view after the rows render. Single-shot on
  // mount (or when focusEventId changes) — we don't re-scroll on every expand.
  useEffect(() => {
    if (!focusEventId) return;
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-event-row="${focusEventId}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 100);
    return () => clearTimeout(id);
  }, [focusEventId]);

  // Build the full row list (sorted newest-first), then derive filter counts.
  // Dependency includes a serialized fingerprint of the current sim alert so
  // the memo recomputes whenever the pusher writes a new alert for this
  // system. useDataRefresh above bumps a render-trigger; this fingerprint
  // tells useMemo it's worth re-deriving.
  const simAlert = getSimulatedAlert(sys.id);
  const simFingerprint = simAlert
    ? `${simAlert.type}|${simAlert.startedAt}|${simAlert.phase || ''}|${(simAlert.events || []).length}|${simAlert.resolved ? 'R' : ''}`
    : '';
  const allRows = useMemo(() => {
    const raw = getLifeEventsForSystem(sys.id) || [];
    return raw
      .map(ev => {
        const c = classify(ev);
        if (!c) return null;
        const { date, time, dateKey } = parseStamp(ev.timestamp);
        return {
          id: ev.id, ...c, date, time, dateKey,
          notifications: ev.notifications || [],
          _seq: ev._seq, // sim-event sequence tiebreaker
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dt = (b.date?.getTime() || 0) - (a.date?.getTime() || 0);
        if (dt !== 0) return dt;
        // Same-minute: prefer the LATER sequence index (newer first). Sim
        // events carry _seq from their position in the events log; static
        // events don't have it, so fall back to 0.
        return (b._seq ?? 0) - (a._seq ?? 0);
      });
  }, [sys.id, simFingerprint]);

  const counts = useMemo(() => {
    const out = { all: allRows.length, water: 0, valve: 0, power: 0, conn: 0 };
    for (const r of allRows) out[r.cat] = (out[r.cat] || 0) + 1;
    return out;
  }, [allRows]);

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return allRows;
    return allRows.filter(r => {
      if (!activeFilters.has(r.cat)) return false;
      // Water sub-filter narrows to High Flow / Low Flow only when the
      // Water main pill is active. Row colour is the discriminator —
      // C_HIGH = high, C_LOW = low (locked by classify()).
      if (r.cat === 'water' && waterSub !== 'all') {
        if (waterSub === 'high' && r.color !== C_HIGH) return false;
        if (waterSub === 'low'  && r.color !== C_LOW)  return false;
      }
      return true;
    });
  }, [allRows, activeFilters, waterSub]);

  // ── Infinite scroll ─────────────────────────────────────────────────────
  // Render the first BATCH rows up front; as the sentinel comes into view,
  // append another BATCH. Mock data is finite, so we stop when we've
  // rendered everything.
  const BATCH = 12;
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef(null);
  const containerRef = useRef(null);

  // Reset visibleCount when the filter set or water sub-filter changes.
  useEffect(() => { setVisibleCount(BATCH); }, [activeFilters, waterSub]);

  useEffect(() => {
    if (!sentinelRef.current || !containerRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e.isIntersecting) return;
      setVisibleCount(c => Math.min(filtered.length, c + BATCH));
    }, { root: containerRef.current, rootMargin: '200px', threshold: 0 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isEmpty = filtered.length === 0;

  // Group visible rows by dateKey, preserving newest-first order.
  const groups = useMemo(() => {
    const acc = [];
    const seen = new Map();
    for (const r of visible) {
      const k = r.dateKey || 'unknown';
      if (!seen.has(k)) { const g = { dateKey: k, items: [] }; seen.set(k, g); acc.push(g); }
      seen.get(k).items.push(r);
    }
    return acc;
  }, [visible]);

  // Toggle row expand / Notified expand.
  const toggleRow = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleNotified = (id) => setNotifiedExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Whether the row supports retroactive tagging — closing water events do
  // (event ended, future event ignored). PRD 15 § 4.3.
  function rowSupportsTag(r) { return r.cat === 'water' && r.resolved; }
  // Each row's expandable panel content. Closing water-event rows always
  // have a panel (Tags section); other rows only if they have Notified.
  function rowHasPanel(r) { return r.notifications.length > 0 || rowSupportsTag(r); }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: theme.bg }}>

      {/* Filter pills — multi-select. Empty selection = show all (no "All"
          pill, since that was a reset-button-disguised-as-a-peer).
          When any filter is active, a small "×" reset button appears INLINE
          at the end of the row - same height, pills don't shift vertically.
          Selected pills carry a small checkmark in their category color. */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 12px',
        background: theme.card, borderBottom: `1px solid ${theme.divider}`,
        flexShrink: 0, alignItems: 'center',
      }}>
        {FILTERS.map(f => {
          const active = activeFilters.has(f.key);
          return (
            <button key={f.key} onClick={() => toggleFilter(f.key)} style={{
              flex: 1, minWidth: 0,
              padding: '6px 8px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer',
              background: active ? f.color + '22' : theme.inputBg,
              color: active ? f.color : theme.textTertiary,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {active && <span className="material-symbols-outlined" style={{ fontSize: 14, color: f.color }}>check</span>}
              {t(`timeline.filters.${f.labelKey}`)}
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button onClick={clearFilters} title="Clear all filters" style={{
            width: 28, height: 28, flexShrink: 0,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: theme.inputBg, color: theme.textTertiary,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, fontFamily: 'inherit',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Water sub-tier — visible only when Water is active. High Flow /
          Low Flow narrows. Same pattern + palette as the Alerts screen. */}
      {activeFilters.has('water') && (
        <div style={{
          display: 'flex', gap: 6, padding: '8px 12px',
          background: 'rgba(219,70,112,0.04)', borderBottom: `1px solid ${theme.divider}`,
          flexShrink: 0,
        }}>
          {[
            { key: 'all',  label: t('timeline.filters.all_water'), color: '#DB4670' },
            { key: 'high', label: t('timeline.filters.high_flow'), color: '#DB4670' },
            { key: 'low',  label: t('timeline.filters.low_flow'),  color: '#F05C25' },
          ].map(s => {
            const active = waterSub === s.key;
            return (
              <button key={s.key} onClick={() => setWaterSub(s.key)} style={{
                flex: 1, minWidth: 0,
                padding: '4px 8px', borderRadius: 999,
                border: `1px solid ${active ? s.color : (theme.cardBorderColor || '#E5E8EE')}`,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? s.color : theme.card,
                color: active ? '#fff' : s.color,
                whiteSpace: 'nowrap',
              }}>{s.label}</button>
            );
          })}
        </div>
      )}

      {/* List */}
      {isEmpty ? (
        <EmptyState filter={activeFilters.size === 1 ? Array.from(activeFilters)[0] : 'all'} onReset={clearFilters} theme={theme} />
      ) : (
        <div ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
          {/* Section anchor - reinforces "you're on this one device" so the
              Timeline can't be confused with cross-fleet Attention. */}
          <div style={{
            padding: '12px 16px 4px',
            fontSize: 10, fontWeight: 700,
            color: theme.textTertiary,
            textTransform: 'uppercase', letterSpacing: '.5px',
          }}>{sys?.name ? t('timeline.activity_on', { name: sys.name }) : t('timeline.activity_on_this_system')}</div>
          {groups.map(group => (
            <div key={group.dateKey}>
              <DayHeader label={dateGroupLabel(group.dateKey, t)} theme={theme} />
              {group.items.map((r, idxInGroup) => (
                <Row
                  key={r.id}
                  row={r}
                  hasPanel={rowHasPanel(r)}
                  supportsTag={rowSupportsTag(r)}
                  isExpanded={expandedIds.has(r.id)}
                  onToggle={() => rowHasPanel(r) && toggleRow(r.id)}
                  isFirstOverall={false}
                  isDayStart={idxInGroup === 0}
                  theme={theme}
                  isNotifiedExpanded={notifiedExpanded.has(r.id)}
                  toggleNotified={() => toggleNotified(r.id)}
                  openTagSheet={openTagSheet}
                  tagBumper={tagBumper}
                />
              ))}
            </div>
          ))}

          {/* Infinite-scroll sentinel + status hint */}
          {hasMore && (
            <div ref={sentinelRef} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '18px 14px 24px',
              fontSize: 12, color: theme.textTertiary,
            }}>
              <span style={{
                display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${theme.divider}`, borderTopColor: theme.textTertiary,
                animation: 'spin 0.9s linear infinite',
              }} />
              Loading older events…
            </div>
          )}
          {!hasMore && filtered.length > BATCH && (
            <div style={{ padding: '16px 14px 22px', textAlign: 'center', fontSize: 12, color: theme.textTertiary }}>
              {t('timeline.no_older_events')}
            </div>
          )}
        </div>
      )}

      {/* Retroactive Tag bottom sheet for closing water-event rows.
          Keyed by event ID — see PRD 15 § 4.3 and tagsStore.js commentary
          on per-event vs per-system keys. */}
      {tagSheetForId && (
        <TagBottomSheet
          currentTags={getTags(tagSheetForId)}
          onClose={closeTagSheet}
          onAdd={(additions) => {
            additions.forEach(t => addTag(tagSheetForId, { ...t, addedBy: getCurrentActor() }));
            setTagBumper(b => b + 1);
          }}
          onRemove={(i) => {
            removeTagAt(tagSheetForId, i);
            setTagBumper(b => b + 1);
          }}
        />
      )}

      {/* Keyframes for the spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Day-group sticky header ──────────────────────────────────────────────
function DayHeader({ label, theme }) {
  // Inline date marker - same 36px rail column + content column grid as
  // a row, so the vertical rail line flows THROUGH the marker without
  // breaking. No background fill, no event count, no sticky positioning.
  // The day label just sits next to the rail as a quiet anchor.
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      gap: 10,
      padding: '14px 14px 6px 12px',
      position: 'relative',
    }}>
      {/* Rail column - just the line passing through, no dot */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          width: 2, top: -10, bottom: -10,
          background: theme.divider, zIndex: 0,
        }} />
      </div>
      {/* Date label */}
      <div style={{
        fontSize: 10, fontWeight: 700,
        color: theme.textTertiary,
        textTransform: 'uppercase', letterSpacing: '.5px',
        alignSelf: 'center',
      }}>{label}</div>
    </div>
  );
}

// ─── Single event row — Variant A anatomy ────────────────────────────────
function Row({ row, hasPanel, supportsTag, isExpanded, onToggle, isDayStart, theme, isNotifiedExpanded, toggleNotified, openTagSheet, tagBumper }) {
  const r = row;
  const dotBg     = r.color + '1A';  // 10% alpha
  const dotBorder = r.color;
  const iconColor = r.color;
  // Re-read tags whenever the bumper increments (after sheet commits).
  // eslint-disable-next-line no-unused-vars
  const _bumper = tagBumper;
  const tagList = supportsTag ? getTags(r.id) : [];

  return (
    <div
      data-event-row={r.id}
      style={{
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      gap: 10,
      padding: '10px 14px 10px 12px',
      position: 'relative',
    }}>
      {/* Rail behind the dot */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        {/* Vertical rail line — runs continuously through the entire
            Timeline column, including across day boundaries. The day
            marker (DayHeader) renders inside the same grid with no
            background, so the rail flows straight through it. */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          width: 2, top: -10, bottom: -10,
          background: theme.divider, zIndex: 0,
        }} />
        {/* Dot */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: dotBg, border: `2px solid ${dotBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative', zIndex: 1, marginTop: 2,
        }}>
          <MIcon name={r.icon} size={18} color={iconColor} fill={r.filled !== false} />
          {/* State badge bottom-right.
              'check' (resolved): WHITE badge with GREEN ✓ - inverted color so
                                  it pops against any bg (the old green-on-green
                                  was hard to read).
              'lock' (closed):    DARK badge with white lock glyph.
              'error':            RED badge with white ! glyph. */}
          {(r.badge || r.resolved) && (() => {
            const badgeKind = r.badge || (r.resolved ? 'check' : null);
            const isCheck = badgeKind === 'check';
            const bg = badgeKind === 'error' ? '#a5455e'
                     : badgeKind === 'lock'  ? '#14151A'
                     : '#fff';
            const ringColor = isCheck ? C_OK : theme.card;
            return (
              <div style={{
                position: 'absolute', right: -4, bottom: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: bg,
                border: `2px solid ${ringColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isCheck && <span style={{ color: C_OK, fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                {badgeKind === 'error' && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>!</span>}
                {badgeKind === 'lock' && <MIcon name="lock" size={8} color="#fff" fill={true} />}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: theme.textTertiary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {fullDateLabel(r.dateKey, r.time)}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 2 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
            {r.title}
          </div>
          {hasPanel && (
            <span
              onClick={onToggle}
              className="material-symbols-outlined"
              style={{
                flexShrink: 0, fontSize: 18, color: theme.textTertiary,
                marginTop: -2, cursor: 'pointer',
              }}
            >{isExpanded ? 'expand_less' : 'expand_more'}</span>
          )}
        </div>
        {r.sub && (
          <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3, lineHeight: 1.4 }}>
            {r.sub}
          </div>
        )}
        {/* Inline chip pill on the closing water-event row (PRD 15 § 4.3.1).
            Untagged: "+ Tag" dashed pill. Tagged: one pill per chip, blue tinted.
            Tap → opens the Tag bottom sheet (event-keyed). */}
        {supportsTag && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {tagList.length === 0 ? (
              <span
                onClick={(e) => { e.stopPropagation(); openTagSheet(r.id); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 9px', borderRadius: 12,
                  fontSize: 11, fontWeight: 600,
                  background: 'transparent', border: '1px dashed #BCC3CE',
                  color: theme.textSecondary, cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: theme.textSecondary }}>add</span>
                Tag
              </span>
            ) : (
              tagList.map((t, i) => {
                const label = t.chip === 'Other' && t.chipOther ? t.chipOther : (t.chip || t.chipOther || '');
                return (
                  <span
                    key={i}
                    onClick={(e) => { e.stopPropagation(); openTagSheet(r.id); }}
                    style={{
                      padding: '3px 9px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      background: 'rgba(11,149,248,0.10)', border: '1px solid #036AB5',
                      color: '#036AB5', cursor: 'pointer',
                    }}
                  >{label}</span>
                );
              })
            )}
          </div>
        )}
        {hasPanel && isExpanded && (
          <ExpandedPanel
            row={r}
            theme={theme}
            isNotifiedExpanded={isNotifiedExpanded}
            toggleNotified={toggleNotified}
            supportsTag={supportsTag}
            tagList={tagList}
            openTagSheet={openTagSheet}
          />
        )}
      </div>
    </div>
  );
}

// ─── Expandable panel — Recipients (method-led) + Tags ───────────────────
// Locked design 2026-06-10. Mirrors the HTML mockup at
// docs/PRD/HTMLs/timeline-tab.html ("Notified panel" section, N1-N7).
// Recipients are grouped BY METHOD (PUSH first since >90% of recipients
// receive it), not by recipient. Method rows with zero recipients are
// omitted entirely (no empty "SMS - none" placeholders).
function ExpandedPanel({ row, theme, isNotifiedExpanded, toggleNotified, supportsTag, tagList, openTagSheet }) {
  const r = row;
  const recipients = r.notifications || [];

  // Group recipients by channel. Skip channels with zero recipients (N6).
  // Order is locked: PUSH first (most common), then SMS, then EMAIL.
  const METHODS = [
    { key: 'push',  label: 'PUSH' },
    { key: 'sms',   label: 'SMS' },
    { key: 'email', label: 'EMAIL' },
  ];
  const methodGroups = METHODS
    .map(m => ({ ...m, names: recipients.filter(n => (n.channels || []).includes(m.key)).map(n => n.name) }))
    .filter(g => g.names.length > 0);

  return (
    <div style={{
      marginTop: 10, padding: '10px 12px',
      background: theme.inputBg || '#F8FAFC',
      border: `1px solid ${theme.divider}`,
      borderRadius: 10,
      fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.45,
    }}>
      {/* Recipients - method-led layout. N2: single-word header (was
          "Notified (N)" - the count is redundant with the names listed). */}
      <div onClick={toggleNotified} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', userSelect: 'none',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
          color: theme.textTertiary,
        }}>Recipients</span>
        <div style={{
          flex: 1, minWidth: 0,
          fontSize: 12.5, color: theme.textSecondary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {/* Folded-state summary line - no envelope, no chips (N3, N7).
              Just the count + a hint to expand. */}
          {!isNotifiedExpanded && (
            <span><b style={{ color: theme.text }}>{recipients.length}</b> {recipients.length === 1 ? 'recipient' : 'recipients'}</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#036AB5', whiteSpace: 'nowrap' }}>
          {isNotifiedExpanded ? 'Hide ↑' : 'Show ↓'}
        </div>
      </div>

      {isNotifiedExpanded && (
        <div style={{ marginTop: 8 }}>
          {/* N1 + N6: one row per non-empty channel, names middle-dot
              separated. No avatars, no per-recipient rows. */}
          {methodGroups.map((g, i) => (
            <div key={g.key} style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              padding: '5px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${theme.divider}`,
            }}>
              <div style={{
                flexShrink: 0, width: 48,
                fontSize: 10, fontWeight: 800,
                letterSpacing: '.5px',
                color: theme.textSecondary,
                textTransform: 'uppercase',
              }}>{g.label}</div>
              <div style={{
                flex: 1, minWidth: 0,
                fontSize: 12, fontWeight: 600,
                color: theme.text, lineHeight: 1.4,
              }}>{g.names.join(' · ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tags section — only on closing water-event rows. PRD 15 § 4.3.2.
          Separated from Notified by a dashed divider. */}
      {supportsTag && (
        <div style={{
          marginTop: recipients.length > 0 ? 10 : 0,
          paddingTop: recipients.length > 0 ? 10 : 0,
          borderTop: recipients.length > 0 ? `1px dashed ${theme.divider}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
              color: theme.textTertiary, flex: 1,
            }}>Tags{tagList.length > 0 ? ` (${tagList.length})` : ''}</span>
            {tagList.length > 0 && (
              <span
                onClick={(e) => { e.stopPropagation(); openTagSheet(r.id); }}
                style={{ fontSize: 11, fontWeight: 600, color: '#036AB5', cursor: 'pointer' }}
              >Edit</span>
            )}
          </div>

          {tagList.length === 0 ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: theme.textTertiary, fontStyle: 'italic', marginBottom: 8 }}>
                Not tagged yet.
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); openTagSheet(r.id); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px', borderRadius: 14,
                  background: '#036AB5', color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>add</span>
                Tag the cause
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {tagList.map((t, i) => {
                const label = t.chip === 'Other' && t.chipOther ? t.chipOther : (t.chip || t.chipOther || '');
                const attrDate = t.addedAt ? new Date(t.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
                const attrTime = t.addedAt ? new Date(t.addedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null;
                const sub = [t.addedBy && `by ${t.addedBy}`, attrDate && `${attrDate} ${attrTime}`].filter(Boolean).join(' · ');
                return (
                  <div key={i} style={{
                    padding: '4px 10px', borderRadius: 14,
                    background: 'rgba(11,149,248,0.10)', border: '1px solid #036AB5',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#036AB5', lineHeight: 1.2 }}>{label}</div>
                    {sub && (
                      <div style={{ fontSize: 10.5, color: theme.textTertiary, fontStyle: 'italic', marginTop: 1 }}>{sub}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// RecipientRow + per-recipient-with-avatar layout removed 2026-06-10. The
// new method-led layout (see ExpandedPanel above) groups by channel instead
// of by recipient - PUSH / SMS / EMAIL rows, names middle-dot separated,
// no avatars. Locked in docs/PRD/HTMLs/timeline-tab.html § Notified panel.

// ─── Empty states ─────────────────────────────────────────────────────────
function EmptyState({ filter, onReset, theme }) {
  if (filter === 'all') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(11,149,248,0.10)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <MIcon name="history_toggle_off" size={30} color="#036AB5" fill={false} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>No activity yet</div>
          <div style={{ fontSize: 13, color: theme.textTertiary, lineHeight: 1.5 }}>
            Tracked: Water Events · valve · power · connectivity
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(113,118,132,0.10)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <MIcon name="filter_alt_off" size={30} color={theme.textSecondary} fill={false} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>No matching events</div>
        <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 12 }}>
          No events in this category on this system.
        </div>
        <button onClick={onReset} style={{
          padding: '8px 16px', borderRadius: 8,
          background: theme.card, border: `1px solid ${theme.divider}`,
          fontSize: 13, fontWeight: 600, color: theme.textSecondary,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Show all</button>
      </div>
    </div>
  );
}
