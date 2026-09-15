"use client";

/**
 * A backend that lives in the browser.
 *
 * With NEXT_PUBLIC_DEMO=true every call in lib/api.js is answered from here
 * instead of over HTTP. It implements exactly the same functions with the
 * same shapes, so when the real server arrives, one environment variable
 * switches the whole app over and nothing else changes.
 *
 * This is not sample data. The store starts empty; every figure it reports is
 * arithmetic on what you typed in yourself. The only thing seeded is the two
 * banks, which are configuration rather than records.
 */

const KEY = "evotech.local.db";

const EMPTY_DB = {
  employees: [],
  attendance: [],
  categories: [],
  subcategories: [],
  brands: [],
  models: [],
  suppliers: [],
  products: [],
  banks: [
    { id: "bank-tbc", name: "TBC Bank", active: true, sortOrder: 1 },
    { id: "bank-bog", name: "Bank of Georgia", active: true, sortOrder: 2 },
  ],
  sales: [],
  saleItems: [],
  expenses: [],
  activity: [],
  notifications: [],
  settings: {
    lateGraceMinutes: 5,
    reinvestPercent: 30,
    accounting: "cash",
    telegram: { enabled: false, chatId: null },
  },
  session: null,
};

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

function read() {
  if (typeof window === "undefined") return structuredClone(EMPTY_DB);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY_DB);
    // Merge against the template so a database written by an older build
    // does not blow up when a new collection is added.
    return { ...structuredClone(EMPTY_DB), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function write(db) {
  if (typeof window === "undefined") return db;
  window.localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

function mutate(fn) {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

export function resetLocalData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

function id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

function fail(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function within(iso, range) {
  if (!range?.from || !range?.to) return true;
  const t = new Date(iso).getTime();
  return t >= new Date(range.from).getTime() && t < new Date(range.to).getTime();
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function minutesLate(scheduledStart, arrived) {
  if (!scheduledStart) return 0;
  const [h, m] = scheduledStart.split(":").map(Number);
  const due = new Date(arrived);
  due.setHours(h, m, 0, 0);
  return Math.round((new Date(arrived) - due) / 60000);
}

/** Product rows carry both ids (for the form) and names (for the tables). */
function decorateProduct(db, product) {
  return {
    ...product,
    category: db.categories.find((c) => c.id === product.categoryId)?.name ?? null,
    subcategory: db.subcategories.find((s) => s.id === product.subcategoryId)?.name ?? null,
    brand: db.brands.find((b) => b.id === product.brandId)?.name ?? null,
    model: db.models.find((m) => m.id === product.modelId)?.name ?? null,
  };
}

function logActivity(db, entry) {
  db.activity.unshift({
    id: id(),
    at: new Date().toISOString(),
    actorName: db.session?.fullName ?? null,
    ...entry,
  });
  db.activity = db.activity.slice(0, 200);
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const auth = {
  async signIn(pin) {
    return mutate((db) => {
      const person = db.employees.find((e) => e.pin === pin);
      if (!person) throw fail("PIN not found", 401);
      if (!person.active) throw fail("Inactive", 403);

      const now = new Date();
      const today = dateKey(now);
      let record = db.attendance.find(
        (a) => a.employeeId === person.id && a.date === today
      );

      // Refreshing the page at 15:00 must not reset this morning's arrival.
      if (!record) {
        record = {
          id: id(),
          employeeId: person.id,
          fullName: person.fullName,
          date: today,
          scheduledStart: person.schedule?.startTime ?? "11:00",
          scheduledEnd: person.schedule?.endTime ?? "19:00",
          clockIn: now.toISOString(),
          clockOut: null,
          lateMinutes: minutesLate(person.schedule?.startTime, now),
          minutesWorked: null,
        };
        db.attendance.unshift(record);
        logActivity(db, {
          kind: "clock_in",
          description: person.fullName,
          actorName: person.fullName,
        });

        if (db.settings.telegram?.enabled) {
          db.notifications.unshift({
            id: id(),
            channel: "telegram",
            text: `${person.fullName} — ${pad(now.getHours())}:${pad(now.getMinutes())} (${record.scheduledStart}), ${record.lateMinutes > 0 ? `+${record.lateMinutes}m` : "on time"}`,
            delivered: true,
            sentAt: now.toISOString(),
          });
        }
      }

      const user = {
        id: person.id,
        fullName: person.fullName,
        roles: person.roles,
        schedule: person.schedule,
      };
      db.session = user;

      return {
        token: `local.${person.id}`,
        user,
        clockIn: {
          at: record.clockIn,
          scheduledStart: record.scheduledStart,
          lateMinutes: record.lateMinutes,
        },
      };
    });
  },

  async me() {
    const db = read();
    if (!db.session) throw fail("No session", 401);
    return db.session;
  },

  async signOut() {
    return mutate((db) => {
      const person = db.session;
      if (person) {
        const today = dateKey(new Date());
        const record = db.attendance.find(
          (a) => a.employeeId === person.id && a.date === today
        );
        if (record && !record.clockOut) {
          const now = new Date();
          record.clockOut = now.toISOString();
          record.minutesWorked = Math.round(
            (now - new Date(record.clockIn)) / 60000
          );
          logActivity(db, { kind: "clock_out", description: person.fullName });
        }
      }
      db.session = null;
      return null;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export const reports = {
  async summary(range) {
    const db = read();
    const sales = db.sales.filter((s) => within(s.soldAt, range));
    const expenses = db.expenses.filter((e) => within(`${e.date}T12:00:00`, range));

    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const byType = { fixed: 0, stock: 0, oneoff: 0 };
    for (const expense of expenses) byType[expense.type] += expense.amount;

    const itemsSold = db.saleItems
      .filter((i) => sales.some((s) => s.id === i.saleId))
      .reduce((sum, i) => sum + i.qty, 0);

    // Cash basis subtracts stock when paid; COGS subtracts it when sold.
    const cogs = db.saleItems
      .filter((i) => sales.some((s) => s.id === i.saleId))
      .reduce((sum, i) => sum + i.unitCost * i.qty, 0);

    const total = byType.fixed + byType.stock + byType.oneoff;
    const netProfit =
      db.settings.accounting === "cogs"
        ? revenue - byType.fixed - byType.oneoff - cogs
        : revenue - total;

    return {
      revenue,
      expenses: { ...byType, total },
      netProfit,
      salesCount: sales.length,
      itemsSold,
      avgSale: sales.length ? revenue / sales.length : 0,
    };
  },

  async salesSeries(range, bucket) {
    const db = read();
    const from = new Date(range.from);
    const to = new Date(range.to);
    const sales = db.sales.filter((s) => within(s.soldAt, range));

    // A single day reads as hours; a year as months. Anything else and the
    // axis turns to mush.
    if (!bucket) {
      const days = (to - from) / 86400000;
      bucket = days <= 1.5 ? "hour" : days <= 92 ? "day" : "month";
    }

    const buckets = [];
    const cursor = new Date(from);

    // Empty buckets are included on purpose: a flat line means "we sold
    // nothing at 11am", not "the data is missing".
    while (cursor < to) {
      const start = new Date(cursor);
      if (bucket === "hour") cursor.setHours(cursor.getHours() + 1);
      else if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);

      const end = new Date(cursor);
      const inBucket = sales.filter((s) => {
        const t = new Date(s.soldAt);
        return t >= start && t < end;
      });

      buckets.push({
        bucket: start.toISOString(),
        label:
          bucket === "hour"
            ? `${pad(start.getHours())}:00`
            : bucket === "month"
              ? `${pad(start.getMonth() + 1)}.${start.getFullYear()}`
              : `${pad(start.getDate())}.${pad(start.getMonth() + 1)}`,
        revenue: inBucket.reduce((sum, s) => sum + s.total, 0),
        sales: inBucket.length,
      });

      if (buckets.length > 400) break;
    }

    return buckets;
  },

  async employeeSales(range) {
    const db = read();
    const sales = db.sales.filter((s) => within(s.soldAt, range));

    return db.employees.map((person) => {
      const theirs = sales.filter((s) => s.cashierId === person.id);
      const revenue = theirs.reduce((sum, s) => sum + s.total, 0);
      const itemsSold = db.saleItems
        .filter((i) => theirs.some((s) => s.id === i.saleId))
        .reduce((sum, i) => sum + i.qty, 0);

      return {
        employeeId: person.id,
        fullName: person.fullName,
        revenue,
        salesCount: theirs.length,
        itemsSold,
        commission:
          person.salaryModel === "commission"
            ? (revenue * (person.commissionRate ?? 0)) / 100
            : null,
      };
    });
  },
};

/* ------------------------------------------------------------------ */
/* Products and classification                                         */
/* ------------------------------------------------------------------ */

export const products = {
  async list(params) {
    const db = read();
    let rows = db.products.filter((p) => !p.archived);

    if (params?.lowStock) {
      rows = rows.filter((p) => p.quantity <= (p.minStockThreshold ?? 0));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      rows = rows.filter((p) =>
        [p.name, p.barcode, p.sku].some((field) => field?.toLowerCase().includes(q))
      );
    }
    return rows.map((p) => decorateProduct(db, p));
  },

  async lowStock() {
    return products.list({ lowStock: true });
  },

  async lookup(code) {
    const db = read();
    const needle = code.toLowerCase();
    const found =
      db.products.find((p) => p.barcode?.toLowerCase() === needle) ??
      db.products.find((p) => p.sku?.toLowerCase() === needle) ??
      db.products.find((p) => p.name.toLowerCase().includes(needle));
    if (!found) throw fail("Not found", 404);
    return decorateProduct(db, found);
  },

  async create(data) {
    return mutate((db) => {
      const product = {
        id: id(),
        archived: false,
        createdAt: new Date().toISOString(),
        ...data,
      };
      db.products.unshift(product);
      logActivity(db, { kind: "product_added", description: product.name });
      return decorateProduct(db, product);
    });
  },

  async update(productId, data) {
    return mutate((db) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product) throw fail("Not found", 404);
      Object.assign(product, data);
      return decorateProduct(db, product);
    });
  },

  async remove(productId) {
    return mutate((db) => {
      const product = db.products.find((p) => p.id === productId);
      if (product) product.archived = true;
      return null;
    });
  },
};

export const classification = {
  async tree() {
    const db = read();
    return db.categories.map((category) => ({
      ...category,
      subcategories: db.subcategories
        .filter((s) => s.categoryId === category.id)
        .map((subcategory) => ({
          ...subcategory,
          brands: db.brands
            .filter((b) => b.subcategoryId === subcategory.id)
            .map((brand) => ({
              ...brand,
              models: db.models.filter((m) => m.brandId === brand.id),
            })),
        })),
    }));
  },

  async createCategory(name) {
    return mutate((db) => {
      const row = { id: id(), name };
      db.categories.push(row);
      return row;
    });
  },
  async createSubcategory(categoryId, name) {
    return mutate((db) => {
      const row = { id: id(), categoryId, name };
      db.subcategories.push(row);
      return row;
    });
  },
  async createBrand(subcategoryId, name) {
    return mutate((db) => {
      const row = { id: id(), subcategoryId, name };
      db.brands.push(row);
      return row;
    });
  },
  async createModel(brandId, name) {
    return mutate((db) => {
      const row = { id: id(), brandId, name };
      db.models.push(row);
      return row;
    });
  },
};

export const suppliers = {
  async list() {
    return read().suppliers;
  },
  async create(name) {
    return mutate((db) => {
      const row = { id: id(), name };
      db.suppliers.push(row);
      return row;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Sales                                                               */
/* ------------------------------------------------------------------ */

export const sales = {
  async list(range) {
    const db = read();
    return db.sales
      .filter((s) => within(s.soldAt, range))
      .map((sale) => ({
        ...sale,
        bankName: db.banks.find((b) => b.id === sale.bankId)?.name ?? null,
        itemCount: db.saleItems.filter((i) => i.saleId === sale.id).length,
      }));
  },

  async create(payload) {
    return mutate((db) => {
      const lines = payload.items.map((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product) throw fail("Product not found", 404);
        if (product.quantity < item.qty) {
          throw fail(`${product.name}: ${product.quantity}`, 409);
        }
        return { product, qty: item.qty };
      });

      // Prices come from the store, never from the request — a stale tab
      // must not sell at yesterday's price.
      const subtotal = lines.reduce(
        (sum, line) => sum + line.product.sellPrice * line.qty,
        0
      );

      let discountAmount = 0;
      if (payload.discount) {
        discountAmount =
          payload.discount.mode === "percent"
            ? (subtotal * payload.discount.value) / 100
            : payload.discount.value;
        discountAmount = Math.min(discountAmount, subtotal);
      }

      const total = Math.max(0, subtotal - discountAmount);
      const saleId = id();
      const receiptNo = db.sales.length + 1001;

      db.sales.unshift({
        id: saleId,
        receiptNo,
        cashierId: payload.cashierId ?? db.session?.id ?? null,
        cashierName: db.session?.fullName ?? null,
        subtotal,
        discountMode: payload.discount?.mode ?? null,
        discountValue: payload.discount?.value ?? null,
        discountAmount,
        total,
        paymentMethod: payload.payment.method,
        bankId: payload.payment.bankId ?? null,
        cashTendered: payload.payment.tendered ?? null,
        changeGiven:
          payload.payment.tendered != null
            ? Math.max(0, payload.payment.tendered - total)
            : null,
        soldAt: new Date().toISOString(),
      });

      for (const line of lines) {
        db.saleItems.push({
          id: id(),
          saleId,
          productId: line.product.id,
          name: line.product.name,
          qty: line.qty,
          unitPrice: line.product.sellPrice,
          unitCost: line.product.costPrice ?? 0,
          lineTotal: line.product.sellPrice * line.qty,
        });
        line.product.quantity -= line.qty;
      }

      logActivity(db, {
        kind: "sale",
        description: `#${receiptNo}`,
        amount: total,
      });

      return {
        id: saleId,
        receiptNo,
        total,
        change:
          payload.payment.tendered != null
            ? Math.max(0, payload.payment.tendered - total)
            : 0,
      };
    });
  },
};

/* ------------------------------------------------------------------ */
/* Banks                                                               */
/* ------------------------------------------------------------------ */

export const banks = {
  async list() {
    return read().banks;
  },
  async create(data) {
    return mutate((db) => {
      const row = { id: id(), active: true, sortOrder: db.banks.length + 1, ...data };
      db.banks.push(row);
      return row;
    });
  },
  async update(bankId, data) {
    return mutate((db) => {
      const bank = db.banks.find((b) => b.id === bankId);
      if (!bank) throw fail("Not found", 404);
      Object.assign(bank, data);
      return bank;
    });
  },
  async remove(bankId) {
    return mutate((db) => {
      // Deleting a bank that appears on a receipt would orphan the record.
      if (db.sales.some((s) => s.bankId === bankId)) throw fail("In use", 409);
      db.banks = db.banks.filter((b) => b.id !== bankId);
      return null;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Expenses                                                            */
/* ------------------------------------------------------------------ */

export const expenses = {
  async list(range) {
    return read()
      .expenses.filter((e) => within(`${e.date}T12:00:00`, range))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  async create(data) {
    return mutate((db) => {
      const row = { id: id(), ...data };
      db.expenses.unshift(row);
      logActivity(db, {
        kind: "expense",
        description: row.description,
        amount: row.amount,
      });
      return row;
    });
  },
  async remove(expenseId) {
    return mutate((db) => {
      db.expenses = db.expenses.filter((e) => e.id !== expenseId);
      return null;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Employees and attendance                                            */
/* ------------------------------------------------------------------ */

export const employees = {
  async list() {
    return read().employees.slice().sort((a, b) => Number(b.active) - Number(a.active));
  },
  async get(employeeId) {
    const person = read().employees.find((e) => String(e.id) === String(employeeId));
    if (!person) throw fail("Not found", 404);
    return person;
  },
  async create(data) {
    return mutate((db) => {
      if (data.pin && db.employees.some((e) => e.pin === data.pin)) {
        throw fail("PIN already in use", 409);
      }
      const row = {
        id: id(),
        active: true,
        roles: ["cashier"],
        schedule: { startTime: "11:00", endTime: "19:00" },
        ...data,
      };
      db.employees.push(row);
      return row;
    });
  },
  async update(employeeId, data) {
    return mutate((db) => {
      const person = db.employees.find((e) => String(e.id) === String(employeeId));
      if (!person) throw fail("Not found", 404);
      Object.assign(person, data);
      return person;
    });
  },
  async setSchedule(employeeId, schedule) {
    return employees.update(employeeId, { schedule });
  },
};

export const attendance = {
  async list(range, params) {
    const db = read();
    return db.attendance
      .filter((row) => within(`${row.date}T12:00:00`, range))
      .filter((row) => !params?.employeeId || String(row.employeeId) === String(params.employeeId))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  async update(recordId, data) {
    return mutate((db) => {
      const row = db.attendance.find((a) => a.id === recordId);
      if (!row) throw fail("Not found", 404);
      Object.assign(row, data);
      if (row.clockIn) row.lateMinutes = minutesLate(row.scheduledStart, row.clockIn);
      return row;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Feed, settings, notifications                                       */
/* ------------------------------------------------------------------ */

export const activity = {
  async list(limit = 8) {
    return read().activity.slice(0, limit);
  },
};

export const settings = {
  async get() {
    return read().settings;
  },
  async update(partial) {
    return mutate((db) => {
      db.settings = { ...db.settings, ...partial };
      return db.settings;
    });
  },
  async testTelegram() {
    return mutate((db) => {
      db.notifications.unshift({
        id: id(),
        channel: "telegram",
        text: "Test",
        delivered: true,
        sentAt: new Date().toISOString(),
      });
      return { ok: true };
    });
  },
};

export const notifications = {
  async list(limit = 30) {
    return read().notifications.slice(0, limit);
  },
};
