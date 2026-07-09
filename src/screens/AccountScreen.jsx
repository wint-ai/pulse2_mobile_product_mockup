import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TabBar from '../components/TabBar';
import PipesHeader, { GLOW_PAGE_BG } from '../components/PipesHeader';
import { useUserContext } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getAccountById } from '../data/accounts';
import { SUPPORTED_LANGUAGES } from '../i18n';

/* -- Toggle (iOS-style) -- */
function Toggle({ on, onToggle, theme }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13, position: 'relative', flexShrink: 0, cursor: 'pointer',
        background: on ? '#34C6E5' : theme.textDimmest, transition: 'background .2s',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: '#fff', position: 'absolute',
        top: 2, left: on ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.18)', transition: 'left .15s',
      }} />
    </div>
  );
}

/* -- Dropdown select -- */
function Dropdown({ value, options, onChange, theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '6px 12px', borderRadius: 8, border: theme.cardBorder, background: theme.card,
          fontSize: 15, fontWeight: 500, color: theme.text, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
        }}
      >
        {value}
        <span style={{ fontSize: 12, color: theme.textTertiary, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .15s' }}>{'\u25BE'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: '100%',
          background: theme.sheetBg, borderRadius: 8, border: theme.cardBorder,
          boxShadow: '0 4px 12px rgba(0,0,0,.3)', zIndex: 20, overflow: 'hidden',
        }}>
          {options.filter(o => o !== value).map(o => (
            <div
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 15, color: theme.textSecondary, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Section card wrapper -- */
function SectionCard({ children, style, theme }) {
  return (
    <div style={{
      background: theme.card, borderRadius: 13, border: theme.cardBorder,
      marginBottom: 10, overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, right, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 6px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: '-0.2px' }}>{children}</div>
      {right}
    </div>
  );
}

/* -- Personal Information detail view -- */
function PersonalInfoView({ persona, onBack, onSignOut, theme }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: theme.bg }}>
      <div style={{ background: theme.headerBg, borderBottom: theme.headerBorder, padding: '11px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={onBack} style={{ cursor: 'pointer', fontSize: 20, color: theme.text, lineHeight: 1, padding: '2px 4px' }}>&larr;</div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: theme.text }}>{t('more.personal_information')}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 8px' }}>
        <SectionCard theme={theme}>
          <SectionTitle theme={theme}>{t('more.personal_information')}</SectionTitle>
          <div style={{ padding: '6px 16px 16px' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: theme.textTertiary, fontWeight: 500, marginBottom: 4 }}>{t('more.profile_fields.first_name')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, color: theme.textTertiary }}>{'\uD83D\uDC64'}</span>
                  <span style={{ fontSize: 15, color: theme.text }}>{persona?.name?.split(' ')[0] || '\u2014'}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: theme.textTertiary, fontWeight: 500, marginBottom: 4 }}>{t('more.profile_fields.last_name')}</div>
                <span style={{ fontSize: 15, color: theme.text }}>{persona?.name?.split(' ').slice(1).join(' ') || '\u2014'}</span>
              </div>
            </div>

            <div style={{ borderTop: theme.separator, paddingTop: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: theme.textTertiary, fontWeight: 500, marginBottom: 4 }}>{t('more.profile_fields.email')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: theme.textTertiary }}>{'\u2709'}</span>
                <span style={{ fontSize: 15, color: theme.textSecondary }}>{persona?.email || '\u2014'}</span>
              </div>
            </div>

            <div style={{ borderTop: theme.separator, paddingTop: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: theme.textTertiary, fontWeight: 500, marginBottom: 4 }}>{t('more.profile_fields.phone_number')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: theme.textTertiary }}>{'\uD83D\uDCF1'}</span>
                <span style={{ fontSize: 15, color: theme.text }}>{persona?.phone || '\u2014'}</span>
              </div>
            </div>

            <div
              onClick={onSignOut}
              style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#DB4670', cursor: 'pointer', padding: '8px 0' }}
            >
              {t('more.sign_out')}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* -- Main Account screen -- */
export default function AccountScreen() {
  const navigate = useNavigate();
  const { persona, setPersona, visibleSystems = [] } = useUserContext() || {};
  // Appearance / theme switcher removed 2026-06-04 — we never used it for real
  // demo decisions and it added noise to the More screen. Only `theme` is
  // needed for styling now.
  const { theme } = useTheme();

  const { t, i18n } = useTranslation();

  const [view, setView] = useState('main');
  const [pushOn, setPushOn] = useState(false);
  const [smsOn, setSmsOn] = useState(false);
  // Store the units choice as a stable KEY, not a localized label, so the
  // dropdown value keeps matching an option even when the language flips.
  const [unitsKey, setUnitsKey] = useState('liters');
  const unitsOptions = [
    { key: 'liters',        label: t('more.units.liters') },
    { key: 'gallons',       label: t('more.units.gallons') },
    { key: 'cubic_meters',  label: t('more.units.cubic_meters') },
  ];
  const unitsLabel = (unitsOptions.find(u => u.key === unitsKey) || unitsOptions[0]).label;
  const unitsLabels = unitsOptions.map(u => u.label);
  function changeUnits(label) {
    const target = unitsOptions.find(u => u.label === label);
    if (target) setUnitsKey(target.key);
  }

  const languageLabel = (SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0]).label;
  const languageOptions = SUPPORTED_LANGUAGES.map(l => l.label);
  function changeLanguage(label) {
    const target = SUPPORTED_LANGUAGES.find(l => l.label === label);
    if (target) i18n.changeLanguage(target.code);
  }

  const [showWarning, setShowWarning] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null);

  function switchProfile() {
    setPersona(null);
    navigate('/select', { replace: true });
  }

  function handleToggle(which) {
    const nextPush = which === 'push' ? !pushOn : pushOn;
    const nextSms = which === 'sms' ? !smsOn : smsOn;
    if (!nextPush && !nextSms) {
      setPendingToggle(which);
      setShowWarning(true);
    } else {
      if (which === 'push') setPushOn(!pushOn);
      else setSmsOn(!smsOn);
    }
  }

  function confirmWarning() {
    if (pendingToggle === 'push') setPushOn(false);
    else setSmsOn(false);
    setShowWarning(false);
    setPendingToggle(null);
  }

  function cancelWarning() {
    setShowWarning(false);
    setPendingToggle(null);
  }

  const bothOff = !pushOn && !smsOn;

  if (view === 'profile') {
    return (
      <PersonalInfoView
        persona={persona}
        onBack={() => setView('main')}
        onSignOut={switchProfile}
        theme={theme}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: GLOW_PAGE_BG }}>
      {/* Header */}
      <PipesHeader glow={true}>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', textAlign: 'center', color: '#14151A' }}>{t('more.title')}</div>
        </div>
      </PipesHeader>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Warning banner */}
        {bothOff && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: 'rgba(219,70,112,0.1)', borderBottom: '1px solid rgba(219,70,112,0.2)',
          }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#DB4670' }}>{t('more.both_off_warning')}</span>
            <span style={{ fontSize: 16, color: theme.textTertiary, cursor: 'pointer' }}>{'\u24D8'}</span>
          </div>
        )}

        <div style={{ padding: '10px 14px 8px' }}>

          {/* Demo banner \u2014 Switch profile sits at the top of More so it's
              obvious this is the demo, not the real product. Tinted purple
              + DEMO chip so users (and reviewers) can't miss it.
              Locked 2026-06-04. */}
          <div
            onClick={switchProfile}
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(11,149,248,0.10) 100%)',
              border: '1px solid rgba(124,58,237,0.30)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124,58,237,0.10)',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#7C3AED', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>swap_horiz</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 4,
                  background: '#7C3AED', color: '#fff',
                }}>{t('more.demo_only')}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: '-0.2px' }}>
                {t('more.switch_profile')}
              </div>
              <div
                style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2, lineHeight: 1.4 }}
                dangerouslySetInnerHTML={{ __html: t('more.switch_profile_desc', { name: persona?.name || 'Wint demo' }) }}
              />
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: theme.textTertiary, flexShrink: 0 }}>chevron_right</span>
          </div>

          {/* Profile card */}
          <SectionCard theme={theme}>
            <div
              onClick={() => setView('profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#04ADEF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{(persona?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{persona?.name || '\u2014'}</div>
                <div style={{ fontSize: 14, color: theme.textTertiary, marginTop: 1 }}>{persona?.email || '\u2014'}</div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 1 }}>{persona?.role || '\u2014'}</div>
              </div>
              <span style={{ fontSize: 18, color: theme.textDimmest }}>{'\u203A'}</span>
            </div>
          </SectionCard>

          {/* Scope */}
          <SectionCard theme={theme}>
            <SectionTitle theme={theme}>{t('more.my_scope')}</SectionTitle>
            <div style={{ padding: '4px 16px 14px' }}>
              {(() => {
                const accountCount = new Set(visibleSystems.map(s => s.account)).size;
                const locationCount = new Set(visibleSystems.map(s => s.l4 || s.l3).filter(Boolean)).size;
                return (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{accountCount}</div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>{t('more.scope_counts.accounts')}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{locationCount}</div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>{t('more.scope_counts.locations')}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{visibleSystems.length}</div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>{t('more.scope_counts.systems')}</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ borderTop: theme.separator, marginTop: 10, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: theme.textTertiary }}>{t('more.scope_permissions.role')}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{t('more.scope_permissions.full_access')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: theme.textTertiary }}>{t('more.scope_permissions.valve_control')}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#A1D246' }}>{t('common.yes')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: theme.textTertiary }}>{t('more.scope_permissions.edit_policies')}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#A1D246' }}>{t('common.yes')}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Personal Settings */}
          <SectionCard theme={theme}>
            <SectionTitle theme={theme}>{t('more.personal_settings')}</SectionTitle>
            <div style={{ padding: '4px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: theme.separator }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.textTertiary }}>language</span>
                  <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{t('more.language')}</div>
                </div>
                <Dropdown value={languageLabel} options={languageOptions} onChange={changeLanguage} theme={theme} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.textTertiary }}>straighten</span>
                  <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{t('more.measurement_units')}</div>
                </div>
                <Dropdown value={unitsLabel} options={unitsLabels} onChange={changeUnits} theme={theme} />
              </div>
            </div>
          </SectionCard>

          {/* Push Notifications */}
          <SectionCard theme={theme}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 6px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: '-0.2px' }}>{t('more.push_notifications_section')}</div>
              <span style={{ fontSize: 18, color: theme.textTertiary, cursor: 'pointer' }}>{'\u2699'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: theme.textTertiary }}>{'\uD83D\uDD14'}</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{t('more.push')}</span>
              </div>
              <Toggle on={pushOn} onToggle={() => handleToggle('push')} theme={theme} />
            </div>
          </SectionCard>

          {/* SMS Notifications */}
          <SectionCard theme={theme}>
            <SectionTitle theme={theme}>{t('more.sms_notifications_section')}</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: theme.textTertiary }}>{'\uD83D\uDCAC'}</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{t('more.sms')}</span>
              </div>
              <Toggle on={smsOn} onToggle={() => handleToggle('sms')} theme={theme} />
            </div>
          </SectionCard>

          {/* Switch Profile / Sign Out moved to the demo banner at the top of
              this screen (2026-06-04). Sign Out also still lives inside the
              Personal Information detail view. */}

          {/* Reset Onboarding */}
          <SectionCard theme={theme}>
            <div
              onClick={() => { sessionStorage.removeItem('pulse2-onboarded'); sessionStorage.setItem('pulse2-onboard-phase', 'home'); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 16 }}>{'\uD83C\uDF93'}</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{t('more.tutorial')}</span>
                <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 1 }}>{t('more.tutorial_desc')}</div>
              </div>
            </div>
          </SectionCard>

          {/* Version */}
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.textMuted, padding: '4px 0 16px' }}>
            {t('more.app_version', { version: '1.2.0' })}
          </div>

        </div>
      </div>

      {/* Warning modal */}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 320, borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          }}>
            <div style={{
              background: '#DB4670', padding: '28px 24px 20px', textAlign: 'center', color: '#fff',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: 'rgba(0,0,0,.15)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, marginBottom: 14,
              }}>{'\uD83D\uDD15'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('more.both_off_modal.title')}</div>
              <div style={{ fontSize: 15, lineHeight: 1.5, opacity: .92 }}>
                {t('more.both_off_modal.body')}
              </div>
            </div>
            <div style={{
              background: theme.modalBg, display: 'flex', padding: '16px 20px 20px', gap: 12,
            }}>
              <button
                onClick={cancelWarning}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: theme.cardBorder,
                  background: theme.card, fontSize: 15, fontWeight: 600, color: theme.text,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >{t('more.both_off_modal.cancel')}</button>
              <button
                onClick={confirmWarning}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: '#DB4670', fontSize: 15, fontWeight: 600, color: '#fff',
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >{t('more.both_off_modal.disable_all')}</button>
            </div>
            <div
              onClick={cancelWarning}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 16, color: '#fff', background: 'rgba(255,255,255,.15)',
              }}
            >{'\u00D7'}</div>
          </div>
        </div>
      )}

      <TabBar activeTab="account" />
    </div>
  );
}
