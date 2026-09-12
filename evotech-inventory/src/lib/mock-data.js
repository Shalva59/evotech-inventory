/* ---------- Classification tree (drives the dependent dropdowns) ---------- */

export const CLASSIFICATION = {
  "Repair parts": {
    "Screens": {
      Apple: ["iPhone 13 Pro", "iPhone 14", "iPhone 15 Pro Max"],
      Samsung: ["Galaxy S22", "Galaxy S23 Ultra", "Galaxy A54"],
      Xiaomi: ["Redmi Note 12", "Poco X5"],
    },
    "Batteries": {
      Apple: ["iPhone 12", "iPhone 13", "iPhone 14 Pro"],
      Samsung: ["Galaxy S21", "Galaxy A52"],
    },
    "Charging ports": {
      Apple: ["iPhone 13", "iPhone 14"],
      Samsung: ["Galaxy S22"],
    },
  },
  Headphones: {
    Wireless: {
      Marshall: ["Major V", "Motif II A.N.C."],
      Sony: ["WH-1000XM5", "WF-C700N"],
      Apple: ["AirPods Pro 2", "AirPods 4"],
    },
    Wired: {
      Sennheiser: ["HD 599", "IE 200"],
      JBL: ["Tune 310C"],
    },
  },
  Accessories: {
    "Cables & chargers": {
      Anker: ["PowerLine III USB-C", "Nano 30W"],
      Baseus: ["CoolPlay 20W"],
    },
    "Cases & glass": {
      Spigen: ["Ultra Hybrid iPhone 15", "Glas.tR iPhone 14"],
    },
  },
  "Tools & consumables": {
    Soldering: {
      Quick: ["861DW", "TS1200A"],
      Sunshine: ["SS-227C"],
    },
    Adhesives: {
      Kafuter: ["B-7000 50ml"],
    },
  },
};

export const SUPPLIERS = [
  "Mobix Parts Ltd",
  "TechSource Georgia",
  "Shenzhen Direct",
  "Caucasus Distribution",
  "Anker Regional",
];

/* ---------- Products ---------- */

export const PRODUCTS = [
  { id: "p1", sku: "SCR-13P-OL", barcode: "4820091001344", name: "iPhone 13 Pro Screen (OLED)", category: "Repair parts", subcategory: "Screens", brand: "Apple", model: "iPhone 13 Pro", costPrice: 185, sellPrice: 340, quantity: 1, minStockThreshold: 4, supplier: "Mobix Parts Ltd" },
  { id: "p2", sku: "SCR-S23U", barcode: "4820091001351", name: "Galaxy S23 Ultra Screen", category: "Repair parts", subcategory: "Screens", brand: "Samsung", model: "Galaxy S23 Ultra", costPrice: 240, sellPrice: 430, quantity: 0, minStockThreshold: 3, supplier: "TechSource Georgia" },
  { id: "p3", sku: "BAT-14P", barcode: "4820091001368", name: "iPhone 14 Pro Battery", category: "Repair parts", subcategory: "Batteries", brand: "Apple", model: "iPhone 14 Pro", costPrice: 42, sellPrice: 95, quantity: 3, minStockThreshold: 6, supplier: "Mobix Parts Ltd" },
  { id: "p4", sku: "BAT-A52", barcode: "4820091001375", name: "Galaxy A52 Battery", category: "Repair parts", subcategory: "Batteries", brand: "Samsung", model: "Galaxy A52", costPrice: 28, sellPrice: 68, quantity: 14, minStockThreshold: 5, supplier: "Shenzhen Direct" },
  { id: "p5", sku: "PRT-13-CP", barcode: "4820091001382", name: "iPhone 13 Charging Port Flex", category: "Repair parts", subcategory: "Charging ports", brand: "Apple", model: "iPhone 13", costPrice: 18, sellPrice: 55, quantity: 2, minStockThreshold: 8, supplier: "Shenzhen Direct" },
  { id: "p6", sku: "HP-MAJ-V", barcode: "7340055308892", name: "Marshall Major V", category: "Headphones", subcategory: "Wireless", brand: "Marshall", model: "Major V", costPrice: 210, sellPrice: 379, quantity: 7, minStockThreshold: 3, supplier: "Caucasus Distribution" },
  { id: "p7", sku: "HP-XM5", barcode: "4548736134584", name: "Sony WH-1000XM5", category: "Headphones", subcategory: "Wireless", brand: "Sony", model: "WH-1000XM5", costPrice: 690, sellPrice: 1090, quantity: 4, minStockThreshold: 2, supplier: "Caucasus Distribution" },
  { id: "p8", sku: "HP-APP2", barcode: "194253397748", name: "AirPods Pro 2", category: "Headphones", subcategory: "Wireless", brand: "Apple", model: "AirPods Pro 2", costPrice: 520, sellPrice: 749, quantity: 9, minStockThreshold: 4, supplier: "Caucasus Distribution" },
  { id: "p9", sku: "CBL-ANK-C", barcode: "194644021313", name: "Anker PowerLine III USB-C 1.8m", category: "Accessories", subcategory: "Cables & chargers", brand: "Anker", model: "PowerLine III USB-C", costPrice: 22, sellPrice: 49, quantity: 38, minStockThreshold: 12, supplier: "Anker Regional" },
  { id: "p10", sku: "CHG-NANO30", barcode: "194644103545", name: "Anker Nano 30W Charger", category: "Accessories", subcategory: "Cables & chargers", brand: "Anker", model: "Nano 30W", costPrice: 45, sellPrice: 89, quantity: 21, minStockThreshold: 8, supplier: "Anker Regional" },
  { id: "p11", sku: "GLS-SPG-15", barcode: "8809896742139", name: "Spigen Glas.tR iPhone 15", category: "Accessories", subcategory: "Cases & glass", brand: "Spigen", model: "Glas.tR iPhone 14", costPrice: 12, sellPrice: 35, quantity: 5, minStockThreshold: 15, supplier: "Caucasus Distribution" },
  { id: "p12", sku: "TL-TS1200", barcode: "6935405600128", name: "Quick TS1200A Soldering Station", category: "Tools & consumables", subcategory: "Soldering", brand: "Quick", model: "TS1200A", costPrice: 480, sellPrice: 720, quantity: 2, minStockThreshold: 1, supplier: "Shenzhen Direct" },
  { id: "p13", sku: "ADH-B7000", barcode: "6941125700012", name: "Kafuter B-7000 Adhesive 50ml", category: "Tools & consumables", subcategory: "Adhesives", brand: "Kafuter", model: "B-7000 50ml", costPrice: 9, sellPrice: 24, quantity: 4, minStockThreshold: 10, supplier: "Shenzhen Direct" },
  { id: "p14", sku: "SCR-RN12", barcode: "6941059648239", name: "Redmi Note 12 Screen", category: "Repair parts", subcategory: "Screens", brand: "Xiaomi", model: "Redmi Note 12", costPrice: 65, sellPrice: 140, quantity: 11, minStockThreshold: 4, supplier: "Shenzhen Direct" },
];

/* ---------- Sales series per range ---------- */

/**
 * @typedef {Object} SalesPoint
 * @property {string} label
 * @property {number} revenue
 * @property {number} expenses
 */

export const SALES_SERIES = {
  today: [
    { label: "09:00", revenue: 140, expenses: 0 },
    { label: "10:00", revenue: 385, expenses: 0 },
    { label: "11:00", revenue: 520, expenses: 180 },
    { label: "12:00", revenue: 310, expenses: 0 },
    { label: "13:00", revenue: 795, expenses: 0 },
    { label: "14:00", revenue: 640, expenses: 240 },
    { label: "15:00", revenue: 1180, expenses: 0 },
    { label: "16:00", revenue: 890, expenses: 0 },
    { label: "17:00", revenue: 1340, expenses: 420 },
    { label: "18:00", revenue: 760, expenses: 0 },
  ],
  week: [
    { label: "Mon", revenue: 3240, expenses: 1180 },
    { label: "Tue", revenue: 4120, expenses: 640 },
    { label: "Wed", revenue: 2890, expenses: 2400 },
    { label: "Thu", revenue: 5310, expenses: 890 },
    { label: "Fri", revenue: 6740, expenses: 1240 },
    { label: "Sat", revenue: 8120, expenses: 760 },
    { label: "Sun", revenue: 4560, expenses: 420 },
  ],
  month: [
    { label: "W1", revenue: 28400, expenses: 12600 },
    { label: "W2", revenue: 31200, expenses: 9800 },
    { label: "W3", revenue: 26800, expenses: 14200 },
    { label: "W4", revenue: 34980, expenses: 11400 },
  ],
};

/* ---------- Expenses ---------- */

export const EXPENSES = [
  { id: "e1", group: "fixed", label: "Shop rent — Pekini Ave.", amount: 2400, date: "2026-09-01", vendor: "Kavlashvili Property", recurring: true },
  { id: "e2", group: "fixed", label: "Salaries (4 staff)", amount: 6800, date: "2026-09-01", recurring: true },
  { id: "e3", group: "fixed", label: "Electricity & internet", amount: 420, date: "2026-09-03", vendor: "Telasi / Magti", recurring: true },
  { id: "e4", group: "fixed", label: "Accounting software", amount: 180, date: "2026-09-01", recurring: true },
  { id: "e5", group: "stock", label: "Screen batch — 20 units", amount: 4200, date: "2026-09-04", vendor: "Mobix Parts Ltd" },
  { id: "e6", group: "stock", label: "Anker restock", amount: 2180, date: "2026-09-07", vendor: "Anker Regional" },
  { id: "e7", group: "stock", label: "Battery batch — 30 units", amount: 1260, date: "2026-09-09", vendor: "Shenzhen Direct" },
  { id: "e8", group: "oneoff", label: "Hot air station replacement", amount: 720, date: "2026-09-05", vendor: "Shenzhen Direct" },
  { id: "e9", group: "oneoff", label: "Window sign repair", amount: 340, date: "2026-09-08" },
];

/* ---------- Activity ---------- */

export const ACTIVITY = [
  { id: "a1", kind: "sale", message: "Sale #1284 — AirPods Pro 2, Spigen glass", actor: "Nino K.", amount: 784, at: "2026-09-13T17:42:00" },
  { id: "a2", kind: "repair", message: "Repair job #402 closed — iPhone 13 screen swap", actor: "Giorgi M.", amount: 340, at: "2026-09-13T17:10:00" },
  { id: "a3", kind: "stock_in", message: "Received 30 batteries from Shenzhen Direct", actor: "Levan T.", at: "2026-09-13T16:25:00" },
  { id: "a4", kind: "sale", message: "Sale #1283 — Anker Nano 30W ×2", actor: "Nino K.", amount: 178, at: "2026-09-13T15:58:00" },
  { id: "a5", kind: "expense", message: "One-time expense logged — hot air station", actor: "Data B.", amount: 720, at: "2026-09-13T14:30:00" },
  { id: "a6", kind: "refund", message: "Refund on Sale #1279 — faulty cable", actor: "Nino K.", amount: 49, at: "2026-09-13T12:15:00" },
  { id: "a7", kind: "login", message: "Signed in to POS terminal 2", actor: "Giorgi M.", at: "2026-09-13T09:02:00" },
];

/* ---------- Employees ---------- */

export const EMPLOYEES = [
  { id: "u1", fullName: "Data Beridze", phone: "+995 555 10 20 30", pin: "••••", active: true, roles: ["admin"], shift: "morning", salaryModel: "fixed", salaryAmount: 2800 },
  { id: "u2", fullName: "Nino Kapanadze", phone: "+995 599 44 55 66", pin: "••••", active: true, roles: ["cashier"], shift: "evening", salaryModel: "commission", commissionRate: 4 },
  { id: "u3", fullName: "Giorgi Maisuradze", phone: "+995 577 88 99 00", pin: "••••", active: true, roles: ["technician", "stock_manager"], shift: "morning", salaryModel: "fixed", salaryAmount: 2200 },
  { id: "u4", fullName: "Levan Tsiklauri", phone: "+995 591 22 33 44", pin: "••••", active: false, roles: ["stock_manager"], shift: "evening", salaryModel: "fixed", salaryAmount: 1600 },
];

/* ---------- Derived totals ---------- */

/** @param {import("./types").TimeRange} range */
export function periodTotals(range) {
  const series = SALES_SERIES[range];
  const revenue = series.reduce((s, p) => s + p.revenue, 0);
  const expenses = series.reduce((s, p) => s + p.expenses, 0);
  return { revenue, expenses, netProfit: revenue - expenses };
}
