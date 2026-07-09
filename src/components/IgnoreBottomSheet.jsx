import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TAG_GROUPS } from '../data/tagTaxonomy';

/**
 * Chip-based Ignore bottom sheet — matches ignore-tag-flows.html Phone 3a/3b
 * (the locked canonical reference).
 *
 * 2026-06-04 — refactored to two-group taxonomy per PRD 14 § 5.1 +
 * PRD 15 § 5.3 / § 5.4:
 *   • Warning block at top (consequences of ignoring).
 *   • Group A — Was something wrong? (5 visible + 3 More)
 *   • Group B — Expected use (6 visible + 4 More + Other free-text)
 *   • Per-group More expansion (independent state per group).
 *   • Same chip set as the Tag bottom sheet — NO chip exclusions.
 *     Broken pipe is intentionally available; the warning block is the
 *     only safeguard (PRD 14 § 5.1.3, PRD 14 § 9 non-goals).
 *   • Single-chip selection (vs Tag sheet's multi-tag) — at ignore time the
 *     user picks the one reason; further tags can be added later via the
 *     closed-event Tag sheet (PRD 15 § 4).
 *   • The Ignore button is always enabled — tag is optional.
 *
 * @param {function} onClose  — dismiss without ignoring.
 * @param {function} onConfirm — called with { chip, chipOther, detail }.
 */

export default function IgnoreBottomSheet({ onClose, onConfirm }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState('');
  const [moreOpen, setMoreOpen] = useState({ wrong: false, expected: false });
  const [otherText, setOtherText] = useState('');

  function commit() {
    onConfirm?.({
      chip: selected || null,
      chipOther: otherText.trim() || null,
      detail: detail.trim() || null,
    });
  }

  function renderChip(chip) {
    const isSelected = selected === chip;
    return (
      <button
        key={chip}
        onClick={() => setSelected(isSelected ? null : chip)}
        style={{
          padding: '8px 13px', borderRadius: 18,
          background: isSelected ? 'rgba(11,149,248,0.12)' : '#F0F2F5',
          border: isSelected ? '1px solid #0B95F8' : '1px solid transparent',
          color: isSelected ? '#036AB5' : '#14151A',
          fontSize: 13, fontWeight: isSelected ? 700 : 500,
          cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >{t(`tag_common.chips.${chip}`, chip)}</button>
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
      >{isOpen ? `${t('tag_common.less')}  ⌃` : `${t('tag_common.more')}  ⌄`}</button>
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
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 700, color: '#14151A', marginBottom: 8 }}>
          {t('ignore_sheet.title')}
          <span
            onClick={() => onClose?.()}
            className="material-symbols-outlined"
            style={{ marginLeft: 'auto', color: '#9DA3AE', cursor: 'pointer', fontSize: 18 }}
          >close</span>
        </div>

        {/* Warning band — spells out the three consequences. Project rule:
            UI copy uses hyphens, never em-dashes. */}
        <div style={{
          background: 'rgba(229,161,0,0.10)', borderLeft: '3px solid #E5A100',
          borderRadius: '0 8px 8px 0', padding: '8px 11px',
          fontSize: 12.5, color: '#8C5A0F', lineHeight: 1.5, margin: '4px 0 12px',
        }}>
          <b style={{ color: '#553a08' }}>{t('ignore_sheet.warning_header')}</b>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            <li>{t('ignore_sheet.warning_bullet_history')}</li>
            <li>{t('ignore_sheet.warning_bullet_no_notify')}</li>
            <li>{t('ignore_sheet.warning_bullet_no_shutoff')}</li>
          </ul>
        </div>

        {/* Two chip groups — identical taxonomy to the standalone Tag sheet
            per PRD 15 § 5.3. NO chip exclusions, including Broken pipe. */}
        {TAG_GROUPS.map((group, gi) => (
          <div key={group.id} style={{ marginTop: gi === 0 ? 0 : 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#717684',
              textTransform: 'uppercase', letterSpacing: '.4px',
              marginBottom: 7,
            }}>
              {t(`tag_common.groups.${group.id}`, group.label)}
              <span style={{ color: '#9DA3AE', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> {t('tag_common.group_label_optional')}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {group.visible.map(c => renderChip(c))}
              {renderMoreToggle(group.id)}
            </div>

            {moreOpen[group.id] && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 4px' }}>
                  {group.more.map(c => renderChip(c))}
                </div>

                {/* "Other" free-text input — only inside group B's More.
                    Per PRD 15 § 5.4.2. */}
                {group.id === 'expected' && (
                  <>
                    <div style={{ borderTop: '1px solid #E8ECF0', margin: '10px 0 8px' }} />
                    <div style={{ fontSize: 12, color: '#717684', marginBottom: 4 }}>{t('tag_common.other_prompt')}</div>
                    <input
                      value={otherText}
                      onChange={e => setOtherText(e.target.value)}
                      placeholder={t('tag_common.other_placeholder')}
                      style={{
                        width: '100%', padding: '8px 10px', fontSize: 13,
                        border: '1px solid #DEE0E3', borderRadius: 8,
                        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        color: '#14151A', background: '#fff',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#0B95F8'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#DEE0E3'; }}
                    />
                  </>
                )}
              </>
            )}
          </div>
        ))}

        {/* Detail field — revealed once a chip is picked */}
        {selected && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#717684', marginBottom: 4 }}>{t('ignore_sheet.detail_label')}</div>
            <input
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder={t('ignore_sheet.detail_placeholder')}
              style={{
                width: '100%', padding: '8px 10px', fontSize: 13,
                border: '1px solid #DEE0E3', borderRadius: 8,
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#14151A', background: '#fff',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0B95F8'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DEE0E3'; }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={() => onClose?.()}
            style={{
              flex: 1, padding: 11, borderRadius: 10,
              background: '#F2F4F7', color: '#4A4F5A',
              border: '1px solid #E2E6EB',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >{t('ignore_sheet.cancel')}</button>
          <button
            onClick={commit}
            style={{
              flex: 1, padding: 11, borderRadius: 10,
              background: '#a5455e', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >{t('ignore_sheet.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
