import { useState } from 'react';
import { TAG_GROUPS } from '../data/tagTaxonomy';

/**
 * Chip-based Tag bottom sheet — multi-tag, immediate-commit.
 *
 * 2026-06-04 — refactored to two-group layout per PRD 15 § 5.4:
 *   • Pitch line "The system learns, your reports get better." below title.
 *   • Group A — Was something wrong? (5 visible + 3 More)
 *   • Group B — Expected use (6 visible + 4 More + Other free-text)
 *   • Per-group More expansion (independent state per group).
 *   • Same chip set across all three phases (Active / Ignore / Closed).
 *
 * Interaction model (unchanged):
 *   1. "Currently tagged" section at the top lists every tag on this Water
 *      Event. Each tag has an × to remove it (immediate).
 *   2. Tap any chip in either group → commits immediately, moves to
 *      "Currently tagged," chip greys out in the picker.
 *   3. "Other" free-text + Add button — type, tap +, joins the list above.
 *   4. Done closes the sheet. Every action is already committed, so there's
 *      no Save / Cancel distinction.
 *
 * @param {Array}    currentTags   — current tags ({ chip, chipOther, detail }[])
 * @param {function} onClose       — dismiss
 * @param {function} onAdd         — called with array of new tags (length 1 per tap)
 * @param {function} onRemove      — called with the index to remove
 */

function tagDisplay(t) {
  if (!t) return '';
  if (t.chip === 'Other' && t.chipOther) return t.chipOther;
  const head = t.chip || t.chipOther || '';
  return t.detail ? `${head} · ${t.detail}` : head;
}

export default function TagBottomSheet({
  currentTags = [],
  onClose,
  onAdd,
  onRemove,
}) {
  // Per-group More expansion state. Each group's More button toggles only
  // that group's hidden chips, independently of the other group.
  const [moreOpen, setMoreOpen] = useState({ wrong: false, expected: false });
  const [otherText, setOtherText] = useState('');

  // Already-applied chips are greyed out + non-tappable to prevent duplicates.
  const appliedChips = new Set(currentTags.map(t => t.chip).filter(Boolean));

  // Tap-to-commit — single chip → single onAdd call → parent refreshes the
  // currentTags list, which immediately re-renders the "Currently tagged" row.
  function commitChip(chip) {
    if (appliedChips.has(chip)) return;
    onAdd?.([{ chip, chipOther: null, detail: null }]);
  }

  function commitOther() {
    const text = otherText.trim();
    if (!text) return;
    onAdd?.([{ chip: 'Other', chipOther: text, detail: null }]);
    setOtherText('');
  }

  function renderChip(chip) {
    const isApplied = appliedChips.has(chip);
    return (
      <button
        key={chip}
        onClick={() => commitChip(chip)}
        disabled={isApplied}
        style={{
          padding: '8px 13px', borderRadius: 18,
          background: '#F0F2F5',
          border: '1px solid transparent',
          color: isApplied ? '#9DA3AE' : '#14151A',
          fontWeight: 500, opacity: isApplied ? 0.55 : 1,
          fontSize: 13, fontFamily: 'inherit',
          cursor: isApplied ? 'not-allowed' : 'pointer',
          lineHeight: 1.2, whiteSpace: 'nowrap',
        }}
        title={isApplied ? 'Already tagged' : undefined}
      >{chip}</button>
    );
  }

  function renderMoreToggle(groupId) {
    const isOpen = moreOpen[groupId];
    return (
      <button
        onClick={() => setMoreOpen(o => ({ ...o, [groupId]: !o[groupId] }))}
        style={{
          padding: '8px 13px', borderRadius: 18,
          background: 'transparent', color: '#036AB5',
          border: '1px dashed #BCC3CE',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', lineHeight: 1.2, whiteSpace: 'nowrap',
        }}
      >{isOpen ? 'Less…  ⌃' : 'More…  ⌄'}</button>
    );
  }

  return (
    <div
      onClick={() => onClose?.()}
      style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', zIndex: 200,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '18px 18px 0 0', width: '100%',
          padding: '12px 16px 18px', maxHeight: '92%', overflowY: 'auto',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.18)',
          color: '#14151A',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#DEE0E3', borderRadius: 2, margin: '0 auto 10px' }} />

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 700, color: '#14151A', marginBottom: 4 }}>
          Tag this Water Event
          <span
            onClick={() => onClose?.()}
            className="material-symbols-outlined"
            style={{ marginLeft: 'auto', color: '#9DA3AE', cursor: 'pointer', fontSize: 18 }}
          >close</span>
        </div>

        {/* Pitch line — locked per PRD 15 § 5.1 step 2. Reinforces the
            motivation the user saw in the End-of-Event push that may have
            led them here. */}
        <div style={{ fontSize: 12.5, color: '#4A4F5A', marginBottom: 12, lineHeight: 1.45 }}>
          The system learns, your reports get better.
        </div>

        {/* ─── Currently tagged ─── */}
        {currentTags.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#717684', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Currently tagged ({currentTags.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentTags.map((t, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  padding: '5px 4px 5px 11px', borderRadius: 18,
                  background: 'rgba(11,149,248,0.10)',
                  color: '#036AB5', fontSize: 13, fontWeight: 600, lineHeight: 1.2,
                }}>
                  {tagDisplay(t)}
                  <button
                    onClick={() => onRemove?.(i)}
                    aria-label={`Remove tag ${tagDisplay(t)}`}
                    title="Remove"
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'transparent', border: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#036AB5',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Two chip groups ─── */}
        {TAG_GROUPS.map((group, gi) => (
          <div key={group.id} style={{ marginTop: gi === 0 ? 0 : 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#717684',
              textTransform: 'uppercase', letterSpacing: '.4px',
              marginBottom: 7,
            }}>
              {group.label}
              <span style={{ color: '#9DA3AE', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> (optional)</span>
            </div>

            {/* Always-visible chips + per-group More toggle */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {group.visible.map(c => renderChip(c))}
              {renderMoreToggle(group.id)}
            </div>

            {/* More expansion — per-group, independent */}
            {moreOpen[group.id] && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 4px' }}>
                  {group.more.map(c => renderChip(c))}
                </div>

                {/* "Other" free-text input — only inside the SECOND group's
                    (expected use) More expansion. Per PRD 15 § 5.4.2. */}
                {group.id === 'expected' && (
                  <>
                    <div style={{ borderTop: '1px solid #E8ECF0', margin: '10px 0 8px' }} />
                    <div style={{ fontSize: 12, color: '#717684', marginBottom: 4 }}>Not in the list? Type it:</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitOther(); }}
                        placeholder="Describe in your own words…"
                        style={{
                          flex: 1, padding: '8px 10px', fontSize: 13,
                          border: '1px solid #DEE0E3', borderRadius: 8,
                          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                          color: '#14151A', background: '#fff',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#0B95F8'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#DEE0E3'; }}
                      />
                      <button
                        onClick={commitOther}
                        disabled={!otherText.trim()}
                        style={{
                          padding: '8px 14px', borderRadius: 8,
                          background: otherText.trim() ? '#14151A' : '#E2E6EB',
                          color: otherText.trim() ? '#fff' : '#9DA3AE',
                          border: 'none',
                          fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                          cursor: otherText.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >Add</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ))}

        {/* Done — closes the sheet. Everything is already saved as the user
            taps chips, so there's no Cancel / Save distinction. */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => onClose?.()}
            style={{
              width: '100%', padding: 11, borderRadius: 10,
              background: '#14151A', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}
