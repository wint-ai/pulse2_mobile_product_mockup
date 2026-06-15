// Water Event Details widget - canonical "active water event" surface on the
// System tab body. Locked design lives at:
//   public/reviews/water-event-widget.html (W1-W30, 2026-06-08)
//   docs/PRD/04a-water-event-widget.md
//
// Anatomy (top to bottom):
//   [optional pills row: On it . me / On it . Sarah / Ignored by ...]
//   [detection lockup: circle + "Detected on" + date + time . Xh Xm ago + state pill]
//   [bold title: "High Flow Event" / "Low Flow Event"]
//   [flow rate row: "Flow rate XX.X L/hour"]
//   [optional action row: Ignore this event . Notify team I'm on it]
//
// States rendered: empty (no active water event), Warning, Ongoing,
// Shutoff, Ignored (muted). Ended is NOT rendered by this widget (W18) -- the
// widget returns to the empty state when an event ends. Empty-state copy is
// "No active Water Events" only -- no "All clear" framing, since other
// dimensions (valve / power / comm) may still need attention and the Health
// widget below surfaces those. The water-event widget reports its dimension
// only. Locked 2026-06-13.
//
// Severity drives the icon color (high flow #DB4670 / low flow #F05C25). State
// pill changes per lifecycle phase. Shutoff is a phase, not a category -- same
// icon + same color as Warning/Ongoing of the same severity (W23).

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import IgnoreBottomSheet from './IgnoreBottomSheet';
import TagBottomSheet from './TagBottomSheet';
import { ignoreIncident, isIgnored as isSystemIgnored, getIgnoredInfo } from '../data/ignoredIncidents';
import { getTags, addTag, removeTagAt } from '../data/tagsStore';
import { getCurrentActor } from '../data/currentUser';
import { computeActiveEvents } from '../data/events';
import { isInvestigating, getInvestigatingInfo, startInvestigating, stopInvestigating } from '../data/investigatingStore';

function MIcon({ name, size = 18, fill = false, color, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", color, lineHeight: 1, ...style }}
    >{name}</span>
  );
}

// Translate alert.type + life-state into our locked vocabulary.
function deriveLifecycle(sys) {
  const alert = sys?.alert;
  if (!alert) return null;
  const isHigh = alert.type === 'leak-high';
  const isLow  = alert.type === 'leak-low';
  if (!isHigh && !isLow) return null;
  let state;
  if (alert.phase) {
    state = alert.phase;
  } else {
    state = sys.valve === 'closed' ? 'shutoff' : 'warning';
  }
  return { level: isHigh ? 'high' : 'low', state };
}

// Severity color (icon + circle background). Same color across Warning /
// Ongoing / Shutoff for the same severity. Locked W23.
const SEVERITY = {
  high: { icon: '#DB4670', bg: '#DB4670' },
  low:  { icon: '#F05C25', bg: '#F05C25' },
};

// State pill (top-right corner). Lifecycle phase only.
const STATE_PILL = {
  warning: { bg: '#FCDEE6', color: '#A5455E', label: 'Warning' },
  ongoing: { bg: '#FCDEE6', color: '#A5455E', label: 'Ongoing' },
  shutoff: { bg: '#B22838', color: '#fff',    label: 'Shutoff' },
  ignored: { bg: '#E6E8EC', color: '#6B7280', label: 'Ignored' },
};

function fmtDuration(ms) {
  if (ms < 0) ms = 0;
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtDate(iso) {
  if (!iso) return { date: '-', time: '' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function fmtTimeShort(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function WaterEventDetailsWidget({ sys, readOnly = false, onAction, hideOnIt = false }) {
  const { theme } = useTheme();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [showIgnore, setShowIgnore] = useState(false);
  const [showTag, setShowTag] = useState(false);
  // Pulse-on-arrival from a push notification deep link.
  const [pulseOnArrival, setPulseOnArrival] = useState(false);
  // Bumper to re-read persisted state after bottom sheets save.
  const [tagBumper, setTagBumper] = useState(0);

  // URL params from push deep links.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const wantsPulse = searchParams.get('pulse') === '1';
    const action = searchParams.get('action');
    let dirty = false;
    let pulseTimeout = null;

    if (wantsPulse) {
      setPulseOnArrival(true);
      pulseTimeout = setTimeout(() => setPulseOnArrival(false), 2000);
      searchParams.delete('pulse');
      dirty = true;
    }
    if (action === 'tag') {
      setShowTag(true);
      searchParams.delete('action');
      dirty = true;
    } else if (action === 'ignore') {
      setShowIgnore(true);
      searchParams.delete('action');
      dirty = true;
    }
    if (dirty) setSearchParams(searchParams, { replace: true });

    return () => { if (pulseTimeout) clearTimeout(pulseTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On-it claim state (Standard only).
  const onItClaimed = isInvestigating(sys.id);
  const onItInfo = getInvestigatingInfo(sys.id);
  const onItActor = onItInfo?.actor || '';
  const currentActor = getCurrentActor() || '';
  // Show "me" when the current viewer claimed it; otherwise show the actor's first name.
  const onItDisplay = (onItActor && onItActor.toLowerCase() === currentActor.toLowerCase())
    ? 'me'
    : (onItActor.split(' ')[0] || onItActor);
  const claimOnIt = () => {
    if (!onItClaimed) {
      startInvestigating(sys.id, { actor: currentActor || 'You' });
      setTagBumper(b => b + 1);
      onAction?.('on-it');
    }
  };
  const standDown = () => {
    if (onItClaimed) {
      stopInvestigating(sys.id);
      setTagBumper(b => b + 1);
      onAction?.('stand-down');
    }
  };
  // Stand-down is only available to the actor who claimed (so they can
  // reverse their own on-it). Others see no on-it button at all.
  const viewerIsTheActor = onItClaimed
    && onItActor
    && onItActor.toLowerCase() === currentActor.toLowerCase();

  const lifecycle = deriveLifecycle(sys);
  // Resolved (Ended) events go to the empty state, NOT to the active card
  // (W18). Empty state = single label "No active Water Events" (plural). No
  // "All clear" framing -- the widget reports the water-event dimension only;
  // other dimensions (valve, power, comm) are surfaced by the Health widget
  // below. "All clear" implied a global system state and contradicted "1
  // issue" on the next widget. Locked 2026-06-13. Same on Standard and Simple.
  // Locked palette: circle #5C9E1A, card gradient #F5FBF0 -> #fff, border
  // #C8E4B4.
  const isEmpty = !lifecycle || sys.alert?.resolved;
  if (isEmpty) {
    return (
      <div style={{
        background: 'linear-gradient(180deg, #F5FBF0 0%, #FFFFFF 100%)',
        border: '1px solid #C8E4B4',
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(20,21,26,0.05)',
        padding: 14,
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#5C9E1A',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <MIcon name="check_circle" size={22} fill color="#FFFFFF" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#14151A',
            lineHeight: 1.2, letterSpacing: '-0.1px',
          }}>No active Water Events</div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line no-unused-vars
  const _bumperRef = tagBumper; // ensure store reads re-run on action
  const isIgnored = isSystemIgnored(sys.id);
  const ignoredInfo = isIgnored ? getIgnoredInfo(sys.id) : null;
  const ignoredActor = ignoredInfo?.ignoredBy || '';
  const ignoredDisplay = (ignoredActor && ignoredActor.toLowerCase() === currentActor.toLowerCase())
    ? 'me'
    : (ignoredActor.split(' ')[0] || ignoredActor || 'someone');
  const ignoredTime = ignoredInfo?.ignoredAt ? fmtTimeShort(ignoredInfo.ignoredAt) : '';

  // Stateful palette.
  const severity = SEVERITY[lifecycle.level];
  const statePillKey = isIgnored ? 'ignored' : lifecycle.state;
  const statePill = STATE_PILL[statePillKey] || STATE_PILL.warning;

  // Timing.
  const computedEvent = (() => {
    try { return computeActiveEvents().find(e => e.system === sys.id) || null; }
    catch { return null; }
  })();
  const parsedTs = computedEvent?.timestamp ? Date.parse(computedEvent.timestamp) : NaN;
  const startMs = Number.isFinite(parsedTs) ? parsedTs : (Date.now() - (3 * 3600000));
  const startedFmt = fmtDate(new Date(startMs).toISOString());
  const sinceLabel = `${fmtDuration(Date.now() - startMs)} ago`;

  // Flow rate.
  const flowRate = sys.alert?.flowRate || sys.alert?.detail?.split('·')[1]?.trim();

  // Title.
  const title = lifecycle.level === 'high' ? 'High Flow Event' : 'Low Flow Event';

  // Action visibility (W17, W19, W27, W30 + W31 stand-down):
  //   Warning Standard:  Ignore + Notify-team-on-it (or Stand down when claimed by viewer)
  //   Warning Simple:    Ignore only
  //   Ongoing/Shutoff Standard: Notify-team-on-it (or Stand down when claimed by viewer)
  //   Ongoing/Shutoff Simple:   no actions
  //   Ignored: no actions
  // When the on-it is claimed by someone other than the viewer, no on-it
  // button shows -- they'd need to coordinate out-of-band to take over.
  const isActiveLifecycle = ['warning', 'ongoing', 'shutoff'].includes(lifecycle.state);
  const showIgnoreBtn = !readOnly && !isIgnored && lifecycle.state === 'warning';
  const showOnItBtn = !readOnly && !isIgnored && !hideOnIt && !onItClaimed && isActiveLifecycle;
  const showStandDownBtn = !readOnly && !isIgnored && !hideOnIt && viewerIsTheActor && isActiveLifecycle;
  // Per Rami 2026-06-15 (reverses the earlier same-day decision): the Tag
  // button does NOT live on the Water Event widget in ANY state. Tag entry
  // points are: (a) the Ignore bottom sheet at ignore-commit time, (b) the
  // End-of-Event push CTA, (c) the Timeline tab row on closed events.
  // The Ignored-state widget has no action row at all (Ignore is irreversible,
  // On it is moot post-ignore, Tag is reached only via Ignore-sheet / push /
  // Timeline). The widget still opens the Tag sheet via the `?action=tag`
  // URL deep-link (push CTA) - that's not a button on the widget, that's the
  // push CTA landing on the System page.

  // Pills row visibility (W20, W27):
  //   On it pill: Standard only (!hideOnIt), when claimed.
  //   Ignored pill: both views, when ignored.
  const showOnItPill = onItClaimed && !hideOnIt && !isIgnored;
  const showIgnoredPill = isIgnored;
  const showPillsRow = showOnItPill || showIgnoredPill;

  // Muted treatment for Ignored state (W25).
  const cardBg = isIgnored ? '#F8F9FB' : (theme.card || '#fff');
  const cardBorder = isIgnored ? '#E6E8EC' : (theme.cardBorderColor || '#E5E8EE');
  const circleBg = isIgnored ? '#B8BCC4' : severity.bg;
  const titleColor = isIgnored ? '#6B7280' : '#14151A';
  const dateColor = isIgnored ? '#6B7280' : '#14151A';
  const subTextColor = isIgnored ? '#8B919C' : '#4A4F5A';
  const microLabelColor = isIgnored ? '#8B919C' : '#717684';
  const flowValueColor = isIgnored ? '#6B7280' : '#14151A';

  // Tag handling (still kept for URL-param deep link from push CTA).
  const tagList = getTags(sys.id);

  const showActionsRow = showIgnoreBtn || showOnItBtn || showStandDownBtn;

  return (
    <>
      <style>{`
        @keyframes pulse2-we-arrival {
          0%   { box-shadow: 0 0 0 0 rgba(11,149,248,0.55), 0 0 0 0 rgba(11,149,248,0.30); }
          40%  { box-shadow: 0 0 0 5px rgba(11,149,248,0.28), 0 0 0 10px rgba(11,149,248,0.10); }
          100% { box-shadow: 0 1px 3px rgba(20,21,26,0.05), 0 0 0 0 rgba(11,149,248,0); }
        }
      `}</style>
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(20,21,26,0.06)',
        padding: 14,
        marginBottom: 8,
        animation: pulseOnArrival ? 'pulse2-we-arrival 2s ease-out 1' : undefined,
      }}>

        {/* Top pills row */}
        {showPillsRow && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {showOnItPill && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700,
                padding: '3px 9px', borderRadius: 999,
                background: '#DEF2E1', color: '#0F6B2B',
              }}>
                <MIcon name="front_hand" size={13} fill color="#0F6B2B" />
                On it · {onItDisplay}
              </span>
            )}
            {showIgnoredPill && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700,
                padding: '3px 9px', borderRadius: 999,
                background: '#FFEDB3', color: '#8C5A0F',
              }}>
                <MIcon name="flag" size={13} fill color="#8C5A0F" />
                Ignored by {ignoredDisplay}{ignoredTime ? ` · ${ignoredTime}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Detection lockup */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: circleBg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MIcon name="water_drop" size={22} fill color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: microLabelColor, lineHeight: 1.2, marginBottom: 2 }}>
              Detected on
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: dateColor, lineHeight: 1.25 }}>
              {startedFmt.date}
            </div>
            <div style={{ fontSize: 12.5, color: subTextColor, marginTop: 2 }}>
              {startedFmt.time}{' '}
              <span style={{ color: microLabelColor }}>· {sinceLabel}</span>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 4,
            background: statePill.bg, color: statePill.color,
            marginLeft: 6, flexShrink: 0,
            alignSelf: 'flex-start', marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>{statePill.label}</span>
        </div>

        {/* Bold title */}
        <div style={{
          fontSize: 18, fontWeight: 800, color: titleColor, lineHeight: 1.2, marginTop: 4,
        }}>{title}</div>

        {/* Flow rate */}
        {flowRate && (
          <div style={{
            fontSize: 12.5, color: subTextColor, marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}>
            Flow rate <strong style={{ color: flowValueColor, fontWeight: 700 }}>{flowRate}</strong>
          </div>
        )}

        {/* Action row */}
        {showActionsRow && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {showIgnoreBtn && (
              <ActionButton
                icon="block"
                label="Ignore this event"
                bg="#FBEAEF"
                color="#A5455E"
                onClick={() => setShowIgnore(true)}
              />
            )}
            {showOnItBtn && (
              <ActionButton
                icon="front_hand"
                label="Notify team I'm on it"
                bg="#EBF3FB"
                color="#036AB5"
                onClick={claimOnIt}
              />
            )}
            {showStandDownBtn && (
              <ActionButton
                icon="back_hand"
                label="Stand down"
                bg="#EBF3FB"
                color="#036AB5"
                onClick={standDown}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom sheets */}
      {showIgnore && (
        <IgnoreBottomSheet
          onClose={() => setShowIgnore(false)}
          onConfirm={({ chip, chipOther, detail }) => {
            const parts = [];
            if (chip === 'Other' && chipOther) parts.push(chipOther);
            else if (chip) parts.push(chip);
            if (detail) parts.push(detail);
            ignoreIncident(sys.id, {
              tag: parts.join(' · ') || null,
              ignoredBy: currentActor,
            });
            setShowIgnore(false);
            setTagBumper(b => b + 1);
            onAction?.('ignored');
          }}
        />
      )}
      {showTag && (
        <TagBottomSheet
          currentTags={tagList}
          onClose={() => setShowTag(false)}
          onAdd={(additions) => {
            additions.forEach(t => addTag(sys.id, { ...t, addedBy: currentActor }));
            setTagBumper(b => b + 1);
            onAction?.('tagged');
          }}
          onRemove={(i) => {
            removeTagAt(sys.id, i);
            setTagBumper(b => b + 1);
            onAction?.('tagged');
          }}
        />
      )}
    </>
  );
}

function ActionButton({ icon, label, bg, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, minWidth: 100,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '11px 12px',
      fontSize: 12.5, fontWeight: 600,
      borderRadius: 10,
      background: bg, color,
      cursor: 'pointer',
      lineHeight: 1.2,
      border: 'none',
      transition: 'filter 0.12s',
    }}
      onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.97)')}
      onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
    >
      <MIcon name={icon} size={16} fill color={color} />
      {label}
    </div>
  );
}
