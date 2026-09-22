/**
 * Single door to the backend.
 *
 * Every screen in this app reads and writes through the functions below —
 * no component builds its own URL. When the backend changes an endpoint,
 * this is the only file that changes.
 *
 * The base URL comes from NEXT_PUBLIC_API_URL (see .env.example).
 */

import * as local from "./local-backend";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Demo mode. With NEXT_PUBLIC_DEMO=true everything below is answered by
 * lib/local-backend.js, which keeps the data in this browser. Same function
 * names, same shapes — flipping the flag is the whole migration.
 */
const DEMO = process.env.NEXT_PUBLIC_DEMO === "true";

const TOKEN_KEY = "evotech.token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Thrown for any non-2xx response. `status` lets callers branch on 401. */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function qs(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

async function request(path, { method = "GET", body, params, signal } = {}) {
  const token = getToken();

  let res;
  try {
    res = await fetch(BASE + path + qs(params), {
      method,
      signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // Network-level failure: server down, wrong port, CORS. Worth naming
    // separately because it is the error the shop will actually hit.
    throw new ApiError("NETWORK", 0, null);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(payload?.message || res.statusText, res.status, payload);
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

const remote_auth = {
  /**
   * PIN sign-in. The backend also opens an attendance record here and, if
   * Telegram is configured, sends the owner the clock-in notice — so the
   * response carries back what it recorded.
   */
  signIn: (pin) => request("/auth/pin", { method: "POST", body: { pin } }),
  me: () => request("/auth/me"),
  signOut: () => request("/auth/logout", { method: "POST" }),
};

/* ------------------------------------------------------------------ */
/* Reports — everything the dashboard shows                            */
/* ------------------------------------------------------------------ */

const remote_reports = {
  summary: (range) => request("/reports/summary", { params: rangeParams(range) }),
  salesSeries: (range) =>
    request("/reports/sales-series", {
      params: { ...rangeParams(range), bucket: bucketFor(range) },
    }),
  employeeSales: (range) =>
    request("/reports/employee-sales", { params: rangeParams(range) }),
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

const remote_products = {
  list: (params) => request("/products", { params }),
  lowStock: () => request("/products", { params: { lowStock: true } }),
  lookup: (code) => request("/products/lookup", { params: { code } }),
  create: (data) => request("/products", { method: "POST", body: data }),
  update: (id, data) => request(`/products/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
};

const remote_classification = {
  tree: () => request("/classification"),
  createCategory: (name) => request("/classification/categories", { method: "POST", body: { name } }),
  createSubcategory: (categoryId, name) =>
    request("/classification/subcategories", { method: "POST", body: { categoryId, name } }),
  createBrand: (subcategoryId, name) =>
    request("/classification/brands", { method: "POST", body: { subcategoryId, name } }),
  createModel: (brandId, name) =>
    request("/classification/models", { method: "POST", body: { brandId, name } }),
};

const remote_suppliers = {
  list: () => request("/suppliers"),
  create: (name) => request("/suppliers", { method: "POST", body: { name } }),
};

/* ------------------------------------------------------------------ */
/* Sales & payment methods                                             */
/* ------------------------------------------------------------------ */

const remote_sales = {
  list: (range, params) => request("/sales", { params: { ...rangeParams(range), ...params } }),
  create: (data) => request("/sales", { method: "POST", body: data }),
};

/** Banks the customer can pay with. Fully editable from Settings. */
const remote_banks = {
  list: () => request("/banks"),
  create: (data) => request("/banks", { method: "POST", body: data }),
  update: (id, data) => request(`/banks/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/banks/${id}`, { method: "DELETE" }),
};

/* ------------------------------------------------------------------ */
/* Money out                                                           */
/* ------------------------------------------------------------------ */

const remote_expenses = {
  list: (range) => request("/expenses", { params: rangeParams(range) }),
  create: (data) => request("/expenses", { method: "POST", body: data }),
  remove: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
};

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const remote_employees = {
  list: () => request("/employees"),
  get: (id) => request(`/employees/${id}`),
  create: (data) => request("/employees", { method: "POST", body: data }),
  update: (id, data) => request(`/employees/${id}`, { method: "PATCH", body: data }),
  /** Scheduled hours. Same window every day, set by the owner. */
  setSchedule: (id, schedule) =>
    request(`/employees/${id}/schedule`, { method: "PUT", body: schedule }),
};

const remote_attendance = {
  list: (range, params) =>
    request("/attendance", { params: { ...rangeParams(range), ...params } }),
  /** Manual correction by the owner — a scanner jam should not cost a wage. */
  update: (id, data) => request(`/attendance/${id}`, { method: "PATCH", body: data }),
};

/* ------------------------------------------------------------------ */
/* Feed, settings, notification log                                    */
/* ------------------------------------------------------------------ */

const remote_activity = {
  list: (limit = 8) => request("/activity", { params: { limit } }),
};

const remote_settings = {
  get: () => request("/settings"),
  update: (data) => request("/settings", { method: "PATCH", body: data }),
  /** Fires a test message so the owner can confirm Telegram works. */
  testTelegram: () => request("/settings/telegram/test", { method: "POST" }),
};

const remote_notifications = {
  list: (limit = 30) => request("/notifications", { params: { limit } }),
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Every report endpoint takes the same two ISO timestamps. */
function rangeParams(range) {
  if (!range) return {};
  return { from: range.from, to: range.to };
}

/**
 * How finely the sales chart should be cut. A single day reads as hours;
 * anything past three months reads as months, or the axis turns to mush.
 */
function bucketFor(range) {
  if (!range) return "day";
  const days = (new Date(range.to) - new Date(range.from)) / 86400000;
  if (days <= 1.5) return "hour";
  if (days <= 92) return "day";
  return "month";
}

export { request };

/* ------------------------------------------------------------------ */
/* One switch decides where every call above actually goes.            */
/* ------------------------------------------------------------------ */

export const auth = DEMO ? local.auth : remote_auth;
export const reports = DEMO ? local.reports : remote_reports;
export const products = DEMO ? local.products : remote_products;
export const classification = DEMO ? local.classification : remote_classification;
export const suppliers = DEMO ? local.suppliers : remote_suppliers;
export const sales = DEMO ? local.sales : remote_sales;
export const banks = DEMO ? local.banks : remote_banks;
export const expenses = DEMO ? local.expenses : remote_expenses;
export const employees = DEMO ? local.employees : remote_employees;
export const attendance = DEMO ? local.attendance : remote_attendance;
export const activity = DEMO ? local.activity : remote_activity;
export const settings = DEMO ? local.settings : remote_settings;
export const notifications = DEMO ? local.notifications : remote_notifications;

export { DEMO };
