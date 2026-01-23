// src/lib/api.js  (atau sesuaikan path yang kamu pakai)

// ==== BASE URL BACKEND ====
// Env support:
// - VITE_API_BASE_URL (contoh: http://localhost:8080/api)  -> prioritas utama
// - VITE_API_URL      (contoh: http://localhost:8080)      -> fallback, otomatis tambahkan /api
// Default: http://localhost:8080/api
const trimSlash = (v) => String(v || "").trim().replace(/\/+$/, "");

const RAW_BASE = trimSlash(import.meta.env.VITE_API_BASE_URL || "");
const RAW_HOST = trimSlash(import.meta.env.VITE_API_URL || "");

export const API_HOST =
  RAW_HOST || (RAW_BASE ? trimSlash(RAW_BASE.replace(/\/api$/i, "")) : "http://localhost:8080");
export const API_BASE = RAW_BASE || `${API_HOST}/api`;

// ==== HELPER UMUM ====
// Semua request lewat sini supaya:
// - Header konsisten (case-insensitive)
// - Token JWT otomatis dikirim
// - Body object/array otomatis JSON.stringify (tanpa [object Object])
// - Tidak mengirim body untuk GET/HEAD
// - Error dari backend ditangkap, lebih informatif (status, data, request_id)
async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  // Support jika path sudah full URL
  const isFullUrl = /^https?:\/\//i.test(String(path || ""));
  const normalizedPath = isFullUrl
    ? String(path)
    : String(path || "").startsWith("/")
      ? `${API_BASE}${path}`
      : `${API_BASE}/${path}`;

  const method = String(options.method || "GET").toUpperCase();

  // Headers case-insensitive
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;

  // Jangan kirim body di GET/HEAD (beberapa server/proxy sensitif)
  if (method === "GET" || method === "HEAD") {
    body = undefined;
  } else {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer;
    const isURLSearchParams = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
    const isReadableStream =
      typeof ReadableStream !== "undefined" && body instanceof ReadableStream;

    const isObjectOrArray =
      body != null &&
      typeof body === "object" &&
      !isFormData &&
      !isBlob &&
      !isArrayBuffer &&
      !isURLSearchParams &&
      !isReadableStream;

    // Jika body object/array => stringify + set content-type jika belum ada
    if (isObjectOrArray) {
      body = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    } else if (typeof body === "string") {
      // Kalau body string (biasanya JSON.stringify sudah dilakukan), tetap set content-type jika belum ada
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
    // Kalau FormData: jangan set Content-Type manual (biar boundary otomatis)
  }

  const res = await fetch(normalizedPath, {
    ...options,
    method,
    headers,
    body,
  });

  // Baca response dengan aman: coba JSON kalau content-type json, kalau tidak fallback ke text
  const contentType = res.headers.get("Content-Type") || "";
  const requestId = res.headers.get("X-Request-Id") || res.headers.get("X-Request-ID") || null;

  let data = null;
  let rawText = "";

  try {
    rawText = await res.text();
  } catch {
    rawText = "";
  }

  if (rawText) {
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    } else {
      // Bukan JSON: simpan string raw
      data = rawText;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request gagal: ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    err.requestId = (data && data.request_id) || requestId || null;
    throw err;
  }

  return data;
}

// ===================================================
// =============== ENDPOINT TESTING ==================
// ===================================================

export async function apiHealth() {
  // cek apakah backend nyala
  return request("/health", { method: "GET" });
}

export async function apiDBCheck() {
  // cek koneksi DB
  return request("/db-check", { method: "GET" });
}

// ===================================================
// =============== AUTH (LOGIN / REGISTER) ===========
// ===================================================

export async function apiLogin(email, password) {
  // kirim object langsung, request() yang stringify
  const data = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  // asumsi backend return { token, user }
  if (data?.token) {
    localStorage.setItem("token", data.token);
  }
  if (data?.user) {
    localStorage.setItem("currentUser", JSON.stringify(data.user));
  }

  return data;
}

export async function apiRegister(userData) {
  // userData: {name, username, email, phone, password}
  return request("/auth/register", {
    method: "POST",
    body: userData,
  });
}

// ===================================================
// ================== USERS (CRUD) ===================
// ===================================================

// GET /api/users
export async function apiGetUsers() {
  return request("/users", { method: "GET" });
}

// GET /api/users/:id
export async function apiGetUserById(id) {
  return request(`/users/${id}`, { method: "GET" });
}

// POST /api/users
export async function apiCreateUser(data) {
  // data: {name, username, email, phone, password, role, status}
  return request("/users", {
    method: "POST",
    body: data,
  });
}

// PUT /api/users/:id
export async function apiUpdateUser(id, data) {
  // data: {name, username, email, phone, password?, role, status}
  return request(`/users/${id}`, {
    method: "PUT",
    body: data,
  });
}

// DELETE /api/users/:id
export async function apiDeleteUser(id) {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
}

// ===================================================
// ============== TRIP INFORMATION (CRUD) ============
// ===================================================

// GET /api/trip-information
export async function apiFetchTrips() {
  return request("/trip-information", { method: "GET" });
}

// POST /api/trip-information
export async function apiCreateTrip(data) {
  return request("/trip-information", {
    method: "POST",
    body: data,
  });
}

// PUT /api/trip-information/:id
export async function apiUpdateTrip(id, data) {
  return request(`/trip-information/${id}`, {
    method: "PUT",
    body: data,
  });
}

// DELETE /api/trip-information/:id
export async function apiDeleteTrip(id) {
  return request(`/trip-information/${id}`, {
    method: "DELETE",
  });
}
