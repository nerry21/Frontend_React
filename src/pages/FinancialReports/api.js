// src/pages/FinancialReports/api.js

// Contoh ENV yang aman:
// VITE_API_URL=http://localhost:8080   (tanpa /api)
// Kalau terlanjur pakai http://localhost:8080/api, file ini tetap aman (tidak dobel /api)

const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').trim();

// buang trailing slash
const API_BASE = RAW_BASE.replace(/\/+$/, '');

// cek absolute url
function isAbsoluteUrl(p) {
  return /^https?:\/\//i.test(p);
}

// pastikan path diawali "/" + pastikan ada prefix "/api"
// jadi kalau kamu panggil "/company-expenses" -> otomatis jadi "/api/company-expenses"
function normalizeApiPath(path) {
  if (!path) return '/api';
  if (isAbsoluteUrl(path)) return path;

  let p = String(path);
  if (!p.startsWith('/')) p = `/${p}`;

  // kalau belum ada prefix /api -> tambahkan
  if (p !== '/api' && !p.startsWith('/api/')) {
    p = `/api${p}`;
  }

  return p;
}

// gabungkan API_BASE + path, dan hindari dobel "/api/api" kalau API_BASE sudah mengandung "/api"
function buildUrl(path) {
  // kalau path absolute, pakai langsung
  if (isAbsoluteUrl(path)) return path;

  let p = normalizeApiPath(path);

  if (!API_BASE) {
    // pakai relative URL (cocok kalau dev pakai proxy)
    return p;
  }

  // kalau API_BASE sudah berakhir dengan "/api" dan path juga diawali "/api" -> hapus salah satunya
  const baseHasApiSuffix = /\/api$/i.test(API_BASE);
  if (baseHasApiSuffix && (p === '/api' || p.startsWith('/api/'))) {
    p = p.replace(/^\/api\b/i, '');
    if (p === '') p = '/';
  }

  return `${API_BASE}${p}`;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);

  const headers = new Headers(options.headers || {});

  // Set JSON header hanya kalau body string (hasil JSON.stringify)
  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // OPTIONAL token
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // timeout biar gak ngegantung
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 20000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(t);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text ? { raw: text } : null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message || data.msg)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.url = url;
    err.body = data;
    throw err;
  }

  return data;
}

// =========================
// ROUTES
// =========================
export const fetchRoutes = () => apiFetch('/routes');

// =========================
// FINANCIAL REPORTS (TRIPS)
// =========================
export const fetchTrips = () => apiFetch('/trips');

export const createTrip = (payload) =>
  apiFetch('/trips', { method: 'POST', body: JSON.stringify(payload) });

export const updateTrip = (id, payload) =>
  apiFetch(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteTrip = (id) =>
  apiFetch(`/trips/${id}`, { method: 'DELETE' });

// =========================
// Trip Information (opsional)
// =========================
export const fetchTripInformation = () => apiFetch('/trip-information');

export const createTripInformation = (payload) =>
  apiFetch('/trip-information', { method: 'POST', body: JSON.stringify(payload) });

export const updateTripInformation = (id, payload) =>
  apiFetch(`/trip-information/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteTripInformation = (id) =>
  apiFetch(`/trip-information/${id}`, { method: 'DELETE' });

// =========================
// VEHICLE COSTS
// =========================
export const fetchVehicleCostsByCarYear = (carCode, year) =>
  apiFetch(
    `/vehicle-costs?carCode=${encodeURIComponent(carCode)}&year=${encodeURIComponent(year)}`
  );

export const upsertVehicleCost = (payload) =>
  apiFetch('/vehicle-costs', { method: 'POST', body: JSON.stringify(payload) });

export const deleteVehicleCostById = (id) =>
  apiFetch(`/vehicle-costs/${id}`, { method: 'DELETE' });

// =========================
// COMPANY EXPENSES
// =========================
export const fetchCompanyExpensesByYear = (year) =>
  apiFetch(`/company-expenses?year=${encodeURIComponent(year)}`);

export const upsertCompanyExpense = (payload) =>
  apiFetch('/company-expenses', { method: 'POST', body: JSON.stringify(payload) });

export const deleteCompanyExpenseById = (id) =>
  apiFetch(`/company-expenses/${id}`, { method: 'DELETE' });
