import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json'), 'utf-8'));
const he = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'locales', 'he.json'), 'utf-8'));

const SECTION_TITLES = {
  common: 'Common',
  tabs: 'Bottom tab bar',
  home: 'Home screen',
  system_detail: 'System Details screen',
  more: 'More page',
  offline: 'Offline / loading / refresh',
};

function flatten(obj, prefix = '') {
  const rows = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      rows.push(...flatten(value, path));
    } else {
      rows.push({ path, value });
    }
  }
  return rows;
}

const enFlat = flatten(en);
const heFlat = flatten(he);
const heMap = Object.fromEntries(heFlat.map(r => [r.path, r.value]));

const bySection = {};
for (const { path: p, value: enVal } of enFlat) {
  const section = p.split('.')[0];
  bySection[section] ??= [];
  bySection[section].push({ path: p, en: enVal, he: heMap[p] ?? '' });
}

const rows = [
  ['Field key', 'English', 'Hebrew', 'Notes / approved?'],
];

for (const [section, entries] of Object.entries(bySection)) {
  rows.push([`= ${SECTION_TITLES[section] || section} =`, '', '', '']);
  for (const e of entries) {
    rows.push([e.path, e.en, e.he, '']);
  }
  rows.push(['', '', '', '']);
}

const ws = XLSX.utils.aoa_to_sheet(rows);

const range = XLSX.utils.decode_range(ws['!ref']);
ws['!cols'] = [
  { wch: 42 },
  { wch: 60 },
  { wch: 60 },
  { wch: 30 },
];

for (let R = range.s.r; R <= range.e.r; R++) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
    if (!cell) continue;
    cell.s = cell.s || {};
    const val = String(cell.v || '');
    if (R === 0) {
      cell.s = { font: { bold: true, sz: 12 }, fill: { fgColor: { rgb: 'D9E7F8' } }, alignment: { horizontal: 'left', vertical: 'center' } };
    } else if (val.startsWith('= ') && val.endsWith(' =')) {
      cell.s = { font: { bold: true, sz: 11 }, fill: { fgColor: { rgb: 'F0F0F0' } }, alignment: { horizontal: 'left' } };
    } else {
      cell.s = { alignment: { wrapText: true, vertical: 'top', horizontal: C === 2 ? 'right' : 'left' } };
    }
  }
}

ws['!rows'] = [];
ws['!rows'][0] = { hpt: 22 };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Translations');

const OUT = path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Desktop', 'pulse2-i18n-translations.xlsx');
XLSX.writeFile(wb, OUT);
console.log(`Wrote ${rows.length} rows to ${OUT}`);
