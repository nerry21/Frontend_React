// src/pages/FinancialReports/mappers.js
import { isReguler, toNumber } from './utils';

function normalizeMonthToUiZeroBased(m) {
  const n = toNumber(m);
  if (n >= 1 && n <= 12) return n - 1; // 1..12 -> 0..11
  if (n >= 0 && n <= 11) return n; // already 0..11
  return 0;
}

function safeStr(v) {
  return String(v ?? '');
}

function safePaymentStatus(v) {
  const s = safeStr(v).trim();
  return s ? s : 'Belum Lunas';
}

export function normalizeTripRow(apiItem) {
  // support:
  // 1) { trip: {...}, calc: {...} }
  // 2) {...}
  const t = apiItem?.trip ?? apiItem ?? {};
  const c = apiItem?.calc ?? {};

  const deptAdmin = toNumber(c.deptAdmin);
  const retAdmin = toNumber(c.retAdmin);

  const deptAdminReg = isReguler(t.deptCategory) ? deptAdmin : 0;
  const deptAdminRentDrop = isReguler(t.deptCategory) ? 0 : deptAdmin;

  const retAdminReg = isReguler(t.retCategory) ? retAdmin : 0;
  const retAdminRentDrop = isReguler(t.retCategory) ? 0 : retAdmin;

  return {
    // base trip
    id: toNumber(t.id),
    day: toNumber(t.day),
    month: normalizeMonthToUiZeroBased(t.month),
    year: toNumber(t.year),

    carCode: safeStr(t.carCode).trim(),
    vehicleName: safeStr(t.vehicleName),
    driverName: safeStr(t.driverName),
    orderNo: safeStr(t.orderNo).trim(),

    deptOrigin: safeStr(t.deptOrigin),
    deptDest: safeStr(t.deptDest),
    deptCategory: safeStr(t.deptCategory),

    deptPassengerCount: toNumber(t.deptPassengerCount),
    deptPassengerFare: toNumber(t.deptPassengerFare),
    deptPackageCount: toNumber(t.deptPackageCount),
    deptPackageFare: toNumber(t.deptPackageFare),

    retOrigin: safeStr(t.retOrigin),
    retDest: safeStr(t.retDest),
    retCategory: safeStr(t.retCategory),

    retPassengerCount: toNumber(t.retPassengerCount),
    retPassengerFare: toNumber(t.retPassengerFare),
    retPackageCount: toNumber(t.retPackageCount),
    retPackageFare: toNumber(t.retPackageFare),

    otherIncome: toNumber(t.otherIncome),
    bbmFee: toNumber(t.bbmFee),
    mealFee: toNumber(t.mealFee),
    courierFee: toNumber(t.courierFee),
    tolParkirFee: toNumber(t.tolParkirFee),

    paymentStatus: safePaymentStatus(t.paymentStatus),

    deptAdminPercentOverride: t.deptAdminPercentOverride ?? null,
    retAdminPercentOverride: t.retAdminPercentOverride ?? null,

    // computed (server calc)
    calc_deptTotal: toNumber(c.deptTotal),
    calc_retTotal: toNumber(c.retTotal),

    calc_deptAdminPercent: toNumber(c.deptAdminPercent),
    calc_deptAdminReg: toNumber(deptAdminReg),
    calc_deptAdminRentDrop: toNumber(deptAdminRentDrop),
    calc_totalAdminKeberangkatan: toNumber(deptAdmin),

    calc_retAdminPercent: toNumber(c.retAdminPercent),
    calc_retAdminReg: toNumber(retAdminReg),
    calc_retAdminRentDrop: toNumber(retAdminRentDrop),
    calc_totalAdminKepulangan: toNumber(retAdmin),

    calc_totalNominal: toNumber(c.totalNominal),
    calc_totalAdmin: toNumber(c.totalAdmin),

    calc_driverSalary: toNumber(c.feeSopir),
    calc_netProfit: toNumber(c.profitNetto),
    calc_residualX: toNumber(c.residualX),
  };
}

export function buildTripPayloadFromForm(formData) {
  const monthUi = toNumber(formData?.month);

  return {
    day: toNumber(formData?.day),
    month: monthUi, // UI 0..11 (backend menerima 0..11 atau 1..12)
    year: toNumber(formData?.year),

    carCode: safeStr(formData?.carCode).trim(),
    vehicleName: safeStr(formData?.vehicleName),
    driverName: safeStr(formData?.driverName),
    orderNo: safeStr(formData?.orderNo).trim(),

    deptOrigin: safeStr(formData?.deptOrigin),
    deptDest: safeStr(formData?.deptDest),
    deptCategory: safeStr(formData?.deptCategory),

    deptPassengerCount: toNumber(formData?.deptPassengerCount),
    deptPassengerFare: toNumber(formData?.deptPassengerFare),
    deptPackageCount: toNumber(formData?.deptPackageCount),
    deptPackageFare: toNumber(formData?.deptPackageFare),

    retOrigin: safeStr(formData?.retOrigin),
    retDest: safeStr(formData?.retDest),
    retCategory: safeStr(formData?.retCategory),

    retPassengerCount: toNumber(formData?.retPassengerCount),
    retPassengerFare: toNumber(formData?.retPassengerFare),
    retPackageCount: toNumber(formData?.retPackageCount),
    retPackageFare: toNumber(formData?.retPackageFare),

    otherIncome: toNumber(formData?.otherIncome),
    bbmFee: toNumber(formData?.bbmFee),
    mealFee: toNumber(formData?.mealFee),
    courierFee: toNumber(formData?.courierFee),
    tolParkirFee: toNumber(formData?.tolParkirFee),

    paymentStatus: safePaymentStatus(formData?.paymentStatus),

    deptAdminPercentOverride:
      formData?.deptAdminPercentOverride === null ||
      formData?.deptAdminPercentOverride === ''
        ? null
        : toNumber(formData?.deptAdminPercentOverride),

    retAdminPercentOverride:
      formData?.retAdminPercentOverride === null ||
      formData?.retAdminPercentOverride === ''
        ? null
        : toNumber(formData?.retAdminPercentOverride),
  };
}
