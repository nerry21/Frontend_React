// src/lib/api.js  (atau sesuaikan path yang kamu pakai)

// ==== BASE URL BACKEND ====
// Bisa di-override lewat .env (VITE_API_BASE_URL),
// kalau nggak ada pakai default localhost:8080/api
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// ==== HELPER UMUM ====
// Semua request lewat sini supaya:
// - Header konsisten
// - Token JWT otomatis dikirim
// - Error dari backend ditangkap dan dilempar sebagai Error JS
async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // kalau response kosong / bukan JSON, biarin
  }

  if (!res.ok) {
    const message =
      data?.error || data?.message || `Request gagal: ${res.status}`;
    throw new Error(message);
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
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
    body: JSON.stringify(userData),
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
    body: JSON.stringify(data),
  });
}

// PUT /api/users/:id
export async function apiUpdateUser(id, data) {
  // data: {name, username, email, phone, password?, role, status}
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
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
    body: JSON.stringify(data),
  });
}

// PUT /api/trip-information/:id
export async function apiUpdateTrip(id, data) {
  return request(`/trip-information/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE /api/trip-information/:id
export async function apiDeleteTrip(id) {
  return request(`/trip-information/${id}`, {
    method: "DELETE",
  });
}
