// src/pages/FinancialReports/utils.js
import { MONTHS_ID } from './constants';

/**
 * Format Rupiah (ID)
 * - Terima number / string
 * - Toleran input "1,000,000" / "1.000.000"
 */
export const toNumber = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

  // handle string numbers with separators (.,)
  const s = String(v).trim();
  if (!s) return 0;

  // Remove all non-digit except minus and dot (keep dot as decimal), then normalize commas
  // Common cases in ID: "1.234.567" => 1234567, "1,234,567" => 1234567
  const normalized = s
    .replace(/\s+/g, '')
    .replace(/,/g, '')        // remove commas
    .replace(/\.(?=\d{3}(\D|$))/g, ''); // remove thousand-dots like 1.234.567

  const x = Number(normalized);
  return Number.isFinite(x) ? x : 0;
};

export const rupiah = (n) => toNumber(n).toLocaleString('id-ID');

export const isReguler = (cat) =>
  String(cat ?? '').toLowerCase().trim() === 'reguler';

export const formatPct = (p) => {
  const n = toNumber(p);
  if (!Number.isFinite(n) || n === 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

/**
 * idx boleh 0..11 (frontend) atau 1..12 (backend)
 */
export function getMonthName(idx) {
  const n = toNumber(idx);
  if (!Number.isFinite(n)) return '-';

  // allow 1..12 -> 0..11
  const zeroBased = n >= 1 && n <= 12 ? n - 1 : n;

  return MONTHS_ID[zeroBased] || '-';
}

export function monthShort(idx) {
  const name = getMonthName(idx);
  return name === '-' ? '-' : name.substring(0, 3);
}

export function getDateLabel(t) {
  const day = String(toNumber(t?.day)).padStart(2, '0');

  // t.month dari backend bisa 0..11 atau 1..12
  const monthLabel = getMonthName(t?.month);
  const year = toNumber(t?.year) || '';

  return `${day} ${monthLabel} ${year}`.trim();
}

/**
 * Ensure selalu ada 12 baris bulan.
 * - Backend biasanya month 1..12
 * - Tapi kalau ada yang 0..11 tetap ditangani
 * - pickMonthFn harus return angka month (0..11 atau 1..12)
 */
export function ensure12MonthsFromApiRows(rows, pickMonthFn) {
  const map = new Map();

  for (const r of rows || []) {
    const raw = pickMonthFn?.(r);
    const mNum = toNumber(raw);

    // normalize: if 0..11 => +1 jadi 1..12
    const m = mNum >= 0 && mNum <= 11 ? mNum + 1 : mNum;

    if (m >= 1 && m <= 12) {
      map.set(m, { ...r, month: m });
    }
  }

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return map.get(m) || { month: m };
  });
}
