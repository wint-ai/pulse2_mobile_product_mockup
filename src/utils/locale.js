// Locale-aware short formatters for dates + durations.
// Not the full Wint Units Format Standards implementation -- covers the
// short mobile row/pill contexts (`Jul 9 · 15:21` and `1h 45m`) shared
// between WaterEventSummary, NonWaterAlertSummary, WaterEventDetailsWidget,
// and the ActivityTab timeline.
//
// Hebrew forms follow common product-native conventions; refine against the
// Wint Units Format Standards wiki when we do the formal pass.

const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HE_MONTHS = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יונ׳','יול׳','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

const DURATION_UNITS = {
  en: { d: 'd',    h: 'h',   m: 'm',   s: 's'    },
  he: { d: 'י׳',  h: 'ש׳',  m: 'ד׳',  s: 'שנ׳' },
};

function months(lang) {
  return lang && lang.startsWith('he') ? HE_MONTHS : EN_MONTHS;
}

function units(lang) {
  return lang && lang.startsWith('he') ? DURATION_UNITS.he : DURATION_UNITS.en;
}

/**
 * Format an ISO timestamp as `<Day> <Mon> · HH:MM` in the current locale.
 * Hebrew: `9 יולי · 15:21` (day-first, native RTL reading order).
 * English: `Jul 9 · 15:21` (month-first).
 */
export function formatShortDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const mon = months(lang)[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const isHe = lang && lang.startsWith('he');
  const datePart = isHe ? `${day} ${mon}` : `${mon} ${day}`;
  return `${datePart} · ${hh}:${mm}`;
}

/**
 * Format a duration in milliseconds as a compact locale-aware string.
 * English: `1h 45m`, `3d`, `12m`, `45s`.
 * Hebrew:  `1ש׳ 45ד׳`, `3י׳`, `12ד׳`, `45שנ׳`.
 * Same rendering as before -- only the unit letters change.
 */
export function formatDurationShort(ms, lang) {
  if (ms == null || isNaN(ms)) return '';
  if (ms < 0) ms = 0;
  const u = units(lang);
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}${u.s}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}${u.m}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h}${u.h} ${m}${u.m}` : `${h}${u.h}`;
  return `${Math.floor(h / 24)}${u.d}`;
}
