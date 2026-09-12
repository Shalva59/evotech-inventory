/**
 * Domain constants and helpers.
 *
 * The project is plain JavaScript, so these JSDoc typedefs are the contract.
 * Editors (VS Code, WebStorm) read them and still give you autocomplete and
 * inline warnings — without a build step or a compiler.
 */

/* ---------- Time range ---------- */

/** @typedef {"today" | "week" | "month"} TimeRange */

export const TIME_RANGE_LABELS = {
  today: "Today",
  week: "This week",
  month: "This month",
};

/* ---------- Inventory ---------- */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} sku
 * @property {string} barcode
 * @property {string} name
 * @property {string} category
 * @property {string} subcategory
 * @property {string} brand
 * @property {string} model
 * @property {number} costPrice
 * @property {number} sellPrice
 * @property {number} quantity
 * @property {number} minStockThreshold  Feeds the dashboard low-stock widget.
 * @property {string} supplier
 * @property {string} [imageUrl]
 */

/** @typedef {"ok" | "low" | "out"} StockLevel */

/**
 * @param {{ quantity: number, minStockThreshold: number }} p
 * @returns {StockLevel}
 */
export function stockLevel(p) {
  if (p.quantity <= 0) return "out";
  if (p.quantity <= p.minStockThreshold) return "low";
  return "ok";
}

/* ---------- POS ---------- */

/**
 * @typedef {Object} CartLine
 * @property {Product} product
 * @property {number} qty
 */

/** @typedef {"percent" | "fixed"} DiscountMode */
/** @typedef {"cash" | "card"} PaymentMethod */

/* ---------- Expenses ---------- */

/** @typedef {"fixed" | "stock" | "oneoff"} ExpenseGroup */

export const EXPENSE_GROUP_META = {
  fixed: {
    label: "Fixed",
    hint: "Repeats every month — rent, salaries, utilities, software",
  },
  stock: {
    label: "Stock purchases",
    hint: "Money paid to suppliers for goods and parts",
  },
  oneoff: {
    label: "One-time",
    hint: "Unplanned — tool replacement, repairs, fines",
  },
};

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {ExpenseGroup} group
 * @property {string} label
 * @property {number} amount
 * @property {string} date
 * @property {string} [vendor]
 * @property {boolean} [recurring]
 */

/* ---------- Employees ---------- */

/** @typedef {"admin" | "cashier" | "technician" | "stock_manager"} Role */

export const ROLE_META = {
  admin: { label: "Admin", scope: "Full access, including financials and users" },
  cashier: { label: "Cashier", scope: "POS, receipts, and daily sales only" },
  technician: { label: "Technician", scope: "Repair jobs and parts consumption" },
  stock_manager: {
    label: "Stock manager",
    scope: "Inventory, suppliers, purchase orders",
  },
};

/** @typedef {"morning" | "evening"} Shift */
/** @typedef {"fixed" | "commission"} SalaryModel */

/**
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} fullName
 * @property {string} phone
 * @property {string} pin  4-digit POS login PIN. Hashed server-side.
 * @property {boolean} active
 * @property {Role[]} roles
 * @property {Shift} shift
 * @property {SalaryModel} salaryModel
 * @property {number} [salaryAmount]
 * @property {number} [commissionRate]
 */

/* ---------- Activity feed ---------- */

/** @typedef {"sale" | "refund" | "stock_in" | "expense" | "repair" | "login"} ActivityKind */

/**
 * @typedef {Object} ActivityItem
 * @property {string} id
 * @property {ActivityKind} kind
 * @property {string} message
 * @property {string} actor
 * @property {number} [amount]
 * @property {string} at
 */

export {};
