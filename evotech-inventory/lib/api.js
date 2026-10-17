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
    throw new ApiError(problemMessage(payload) || res.statusText, res.status, payload);
  }

  return payload;
}

/**
 * შეცდომის ტექსტის ამოღება სერვერის პასუხიდან.
 *
 * .NET API შეცდომას ასეთი ფორმით აბრუნებს (problem+json):
 *   {
 *     "title": "One or more validation errors occurred.",
 *     "status": 400,
 *     "errors": { "Name": ["Brand name is required."] }
 *   }
 *
 * ეს ფუნქცია იქიდან გასაგებ ტექსტს იღებს, რომ ეკრანზე
 * „Brand name is required.“ გამოჩნდეს და არა უბრალოდ „Bad Request“.
 */
function problemMessage(payload) {
  // პასუხი ცარიელია ან JSON არ არის — ტექსტი არ გვაქვს
  if (!payload || typeof payload !== "object") return null;
  // ძველი ფორმატი: { "message": "..." }
  if (payload.message) return payload.message;
  // ველების შეცდომები: { "errors": { "Name": ["..."], ... } } → ყველას ერთ ხაზად ვაერთებთ
  if (payload.errors) return Object.values(payload.errors).flat().join(" ");
  // დანარჩენ შემთხვევებში — "detail" ან "title"
  return payload.detail || payload.title || null;
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
  get: (id) => request(`/products/${id}`),
  lookup: (code) => request("/products/lookup", { params: { code } }),
  create: (data) => request("/products", { method: "POST", body: data }),
  update: (id, data) => request(`/products/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  /** Goods arriving: adds quantity, averages cost, optionally books the expense. */
  receive: (id, data) => request(`/products/${id}/receive`, { method: "POST", body: data }),
};

const remote_categories = {
  list: () => request("/categories"),
  create: (data) => request("/categories", { method: "POST", body: data }),
  update: (id, data) => request(`/categories/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/categories/${id}`, { method: "DELETE" }),
  createSubcategory: (categoryId, name) =>
    request(`/categories/${categoryId}/subcategories`, { method: "POST", body: { name } }),
  removeSubcategory: (id) => request(`/subcategories/${id}`, { method: "DELETE" }),
};

/** Accessory makers — Spigen, Baseus. Not tied to any category. */
/**
 * ბრენდები — .NET API-სთან კავშირი (/api/v1/brands)
 * ─────────────────────────────────────────────────
 * ბრენდები ყოველთვის რეალურ სერვერზე მიდის, დემო რეჟიმშიც
 * (NEXT_PUBLIC_DEMO=true), რადგან ბრენდები აუცილებლად API-ში უნდა ინახებოდეს.
 *
 * რა აქვს API-ს ახლა:
 *   GET  /api/v1/brands        — სია
 *   POST /api/v1/brands        — ახლის შექმნა  { name, isActive }
 *   GET  /api/v1/brands/{id}   — ერთი ბრენდი
 * შეცვლა (PUT) და წაშლა (DELETE) ჯერ არ არის.
 *
 * ლოგო: API-ს ლოგოს ველი ჯერ არ აქვს, ამიტომ სურათს ბრაუზერში
 * (localStorage) ვინახავთ ბრენდის id-ის მიხედვით.
 * ⚠ ლოგო ჩანს მხოლოდ ამ ბრაუზერში — სხვა კომპიუტერზე არა.
 * როცა ბექენდს "logo" ველი დაემატება: create-ში body-ში logo ჩაამატე
 * და readBrandLogos / saveBrandLogo წაშალე.
 */

// localStorage-ის გასაღები, რომლის ქვეშაც ლოგოები ინახება.
// შიგნით ასე გამოიყურება: { "15": "data:image/png;base64,...", "16": "..." }
const BRAND_LOGOS_KEY = "evotech.brandLogos";

/** ყველა შენახული ლოგოს წაკითხვა ბრაუზერიდან. */
function readBrandLogos() {
  // სერვერზე (Next.js-ის რენდერისას) window არ არსებობს
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(BRAND_LOGOS_KEY)) ?? {};
  } catch {
    // ჩანაწერი დაზიანებულია ან წვდომა დაბლოკილია — ვაბრუნებთ ცარიელს
    return {};
  }
}

/** ერთი ბრენდის ლოგოს შენახვა (ან წაშლა, თუ logo ცარიელია). */
function saveBrandLogo(id, logo) {
  if (typeof window === "undefined") return;
  const logos = readBrandLogos();
  if (logo) logos[id] = logo;
  else delete logos[id];
  try {
    window.localStorage.setItem(BRAND_LOGOS_KEY, JSON.stringify(logos));
  } catch {
    // მეხსიერება გაივსო — ბრენდი სერვერზე მაინც შეინახა, იკარგება მხოლოდ ლოგო.
  }
}

const remote_brands = {
  /**
   * ბრენდების სია.
   * GET /api/v1/brands?includeInactive=true
   * includeInactive=true — მის გარეშე API მხოლოდ აქტიურებს აბრუნებს,
   * ჩვენ კი გამორთულებიც გვჭირდება, რომ ცალკე სექციაში ვაჩვენოთ.
   */
  async list() {
    const rows = await request("/v1/brands", { params: { includeInactive: true } });
    const logos = readBrandLogos();
    // თითოეულ ბრენდს ვამატებთ მის ლოგოს ბრაუზერიდან (თუ აქვს)
    return rows.map((brand) => ({ ...brand, logo: logos[brand.id] ?? null }));
  },

  /**
   * ახალი ბრენდის შექმნა.
   * POST /api/v1/brands   body: { "name": "...", "isActive": true }
   * სერვერი აბრუნებს შექმნილ ბრენდს id-ით: { id, name, isActive }.
   * ამ id-ით ლოგოს ბრაუზერში ვინახავთ.
   */
  async create({ name, isActive, logo }) {
    const brand = await request("/v1/brands", {
      method: "POST",
      body: { name, isActive }, // ლოგო არ იგზავნება — API-ს ეს ველი ჯერ არ აქვს
    });
    saveBrandLogo(brand.id, logo);
    return { ...brand, logo: logo ?? null };
  },
};

/** The phones and laptops a product fits. Many-to-many with products. */
const remote_devices = {
  list: () => request("/devices"),
  create: (data) => request("/devices", { method: "POST", body: data }),
  update: (id, data) => request(`/devices/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/devices/${id}`, { method: "DELETE" }),
};

const remote_suppliers = {
  list: () => request("/suppliers"),
  create: (data) =>
    request("/suppliers", {
      method: "POST",
      body: typeof data === "string" ? { name: data } : data,
    }),
  update: (id, data) => request(`/suppliers/${id}`, { method: "PATCH", body: data }),
  remove: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),
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
export const categories = DEMO ? local.categories : remote_categories;
// ბრენდები დემო რეჟიმს არ ემორჩილება — ყოველთვის რეალური API (იხ. remote_brands ზემოთ)
export const brands = remote_brands;
export const devices = DEMO ? local.devices : remote_devices;
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
