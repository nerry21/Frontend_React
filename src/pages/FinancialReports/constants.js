// src/pages/FinancialReports/constants.js

export const CAR_CODES = ['LK01', 'LK02', 'LK03', 'LK04', 'LK05'];

export const DRIVERS = [
  'Hamtoni',
  'Mayzar',
  'Sulaiman',
  'Rasyid',
  'Ade',
  'Rusdy',
  'Adi',
];

export const CATEGORIES = ['Reguler', 'Dropping', 'Rental'];

export const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const YEARS = Array.from({ length: 6 }, (_, i) => 2025 + i); // 2025-2030
export const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Dipakai oleh VehicleCostsMatrix.jsx
 * key harus sama dengan field yang dipakai backend & UI
 */
export const VEHICLE_COST_TYPES = Object.freeze([
  { key: 'maintenanceFee', label: 'Pemeliharaan' },
  { key: 'insuranceFee', label: 'Asuransi' },
  { key: 'installmentFee', label: 'Cicilan' },
]);

/**
 * NOTE:
 * - 3 field di bawah (maintenanceFee/insuranceFee/installmentFee) adalah "biaya bulanan"
 * - Jangan pernah ikut dikirim ke /api/trips (TripDTO backend tidak menyimpan)
 * - Saat Save trip: upsert ke /vehicle-costs (per bulan & tahun) — ini sudah benar.
 */
export const InitialTransactionState = {
  // date parts
  day: 1,
  month: 0, // 0-11 (UI)
  year: 2025,

  // basic info
  carCode: CAR_CODES[0] || 'LK01',
  vehicleName: '',
  driverName: DRIVERS[0] || 'Hamtoni',
  orderNo: '',

  // route (keberangkatan)
  deptOrigin: 'Rokan Hulu',
  deptDest: 'Pekanbaru',
  deptCategory: 'Reguler',
  deptPassengerCount: 0,
  deptPassengerFare: 0,
  deptPackageCount: 0,
  deptPackageFare: 0,

  // route (kepulangan)
  retOrigin: 'Pekanbaru',
  retDest: 'Rokan Hulu',
  retCategory: 'Reguler',
  retPassengerCount: 0,
  retPassengerFare: 0,
  retPackageCount: 0,
  retPackageFare: 0,

  // additional income
  otherIncome: 0,

  // expenses (trip)
  bbmFee: 300000,
  mealFee: 100000,
  courierFee: 0,
  tolParkirFee: 0,

  // =========================
  // MONTHLY VEHICLE COSTS (OPTIONAL)
  // =========================
  maintenanceFee: 0,
  insuranceFee: 0,
  installmentFee: 0,

  // overrides
  deptAdminPercentOverride: null,
  retAdminPercentOverride: null,

  // status
  paymentStatus: 'Belum Lunas',
};
