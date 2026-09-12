# EVOTECH — Store operations

ERP and point of sale for an electronics retail and mobile repair store.
Next.js 14 (App Router) · React 18 · JavaScript (JSX) · Tailwind CSS · Recharts · Lucide.

```bash
npm install
npm run dev      # http://localhost:3000
```

Everything runs on mock data in `lib/mock-data.ts`, so all five modules are
clickable before any backend exists.

---

## Design system

Dark mode is the only theme — a repair bench is usually lit by a lamp, and
staff stare at these screens for eight hours.

| Token | Value | Used for |
| --- | --- | --- |
| `bg` / `surface` / `elevated` | slate-blue blacks | Three depth steps, separated by hairlines rather than shadows |
| `brass` | `hsl(38 55% 52%)` | Brand, primary actions, active nav, stock alerts |
| `jade` | `hsl(158 46% 45%)` | Reserved for committing money — checkout, net profit, confirmations |
| `danger` | `hsl(6 64% 57%)` | Out of stock, refunds, negative margin. Never decorative |
| `info` | `hsl(213 55% 62%)` | Fixed expenses, stock-in events |

**Type** — Archivo for UI, JetBrains Mono for every number, SKU, and barcode.
The `.tnum` utility forces tabular figures so columns of prices line up. In a
POS this is a functional requirement, not a stylistic one.

**Panels** use a 4px radius and a single hairline border. No drop shadows: on a
dark UI they read as blur and make dense screens feel imprecise.

---

## Structure

```
app/
  layout.jsx            App shell — sidebar + mobile bottom nav
  page.jsx              1. Dashboard
  pos/page.jsx          2. Point of sale
  inventory/
    page.jsx               Product list
    new/page.jsx        3. Add product
  expenses/page.jsx     4. Expenses
  employees/
    page.jsx               Staff list
    new/page.jsx        5. Add employee

components/
  ui/                   Primitives — Button, Input, Select, Field,
                        ToggleGroup, Switch, Checkbox, Panel
  shell/                Sidebar, MobileNav, PageHeader
  dashboard/            TimeFilter, KpiRow, SalesChart,
                        LowStockAlerts, RecentActivity
  pos/                  ScannerInput, CartTable, CheckoutPanel
  forms/                ProductForm, EmployeeForm

lib/
  types.js              Shared constants + stockLevel(), with JSDoc typedefs
  utils.js              cn(), money(), timeAgo()
  mock-data.js          Products, sales series, expenses, staff, activity
```

The project is plain JavaScript — no compile step, no `tsconfig.json`. Path
aliases (`@/components/...`) come from `jsconfig.json`, which Next.js reads
natively.

`lib/types.js` keeps the domain shapes as JSDoc `@typedef` blocks. VS Code and
WebStorm read those and still give autocomplete on `product.minStockThreshold`
or `employee.roles`, and still warn on typos — without TypeScript in the build.
If you later want real type checking, add `// @ts-check` at the top of a file
and the editor will enforce those same typedefs.

The `ui/` primitives follow the shadcn API shape (`cva` variants, `forwardRef`,
`cn` merging), so you can drop in real shadcn components later without
rewriting call sites. Note that shadcn ships TypeScript by default — run its
CLI with the JavaScript option if you add components later.

---

## Module notes

### 1. Dashboard

`TimeFilter` holds the single source of truth for the period. KPIs, chart, and
comparisons all derive from it — change the dropdown and the whole page moves
together.

**Reinvestment budget** is not stored anywhere. It is computed live:

```
reinvestmentBudget = max(0, netProfit) × reinvestPct
```

The percentage is adjustable inline (20 / 30 / 40 / 50%) because the right
answer changes month to month. Clamping at zero matters: a loss-making month
must not suggest a negative restock budget.

**Low stock alerts** are styled unlike every other panel — brass border, brass
header bar — so the eye finds them without searching. Items are sorted by
quantity ascending, so genuinely out-of-stock parts sit at the top, and the
footer totals what restocking to minimum would cost.

### 2. POS

The scanner field reclaims focus whenever the cashier types anywhere else on
the page. Hardware scanners emulate a keyboard and finish with Enter, so a scan
that lands in the void is the single most common POS failure — this prevents it.

Lookup matches barcode, SKU, or a substring of the name, so a missing label
doesn't stop a sale. Scanning the same item twice increments the line instead of
adding a duplicate row.

Cash tendered and change due appear only when Cash is selected. Change is
calculated live and turns red when the amount is short.

### 3. Inventory

The four classification dropdowns are genuinely dependent — each level reads
from `CLASSIFICATION` and resets everything below it when changed, so an
impossible combination (Marshall → iPhone 13 Screen) can't be saved.

Cost price and sell price produce a **live margin panel**. If sell price drops
below cost, the panel turns red and says so plainly. Catching a mispriced item
at entry is far cheaper than catching it in a monthly report.

`minStockThreshold` is the field that feeds the dashboard alert widget.

### 4. Expenses — how net profit is calculated

Three categories, each subtracting from revenue:

| Category | Contents | Behaviour |
| --- | --- | --- |
| **Fixed** | Rent, salaries, utilities, software | Recurring — auto-posts each month |
| **Stock purchases** | Payments to suppliers for goods and parts | Logged when a purchase order is paid |
| **One-time** | Tool replacement, repairs, fines | Ad hoc |

```
totalExpenses = fixed + stockPurchases + oneOff
netProfit     = totalRevenue − totalExpenses
```

The page renders this equation as a live row of terms, plus a proportional bar
showing where each lari of revenue ends up — expense slices first, retained
profit filling the remainder.

**One decision to make before going live.** There are two valid ways to treat
stock purchases:

- *Cash basis* (implemented here) — subtract the purchase the month you pay the
  supplier. Simple, and matches what leaves the bank account. Downside: a large
  restock month looks unprofitable even though you now hold valuable stock.
- *COGS basis* — subtract a product's cost price only when that product
  actually sells. Smoother and more accurate month to month, but it requires
  per-unit cost tracking.

Every product already stores `costPrice` and the POS knows the cost of each line
it sells, so switching to COGS later is a reporting change rather than a schema
migration.

### 5. Employees

The PIN is four separate boxes that auto-advance, mirroring how it will be typed
at the terminal each shift. Roles are multi-select because one person genuinely
is both technician and stock manager. Selecting Admin shows a warning, since
that role exposes cost prices, margins, and payroll.

Choosing a fixed salary reveals a monthly amount that posts to Fixed expenses;
choosing commission reveals a rate instead.

---

## Wiring up a backend

Each page currently imports from `lib/mock-data.ts`. Replace those imports with
real fetches:

| Screen | Call |
| --- | --- |
| Dashboard | `GET /api/reports/summary?range=week` |
| POS lookup | `GET /api/products?barcode=…` |
| POS checkout | `POST /api/sales` → decrement stock, print receipt |
| Add product | `POST /api/products` |
| Expenses | `GET` / `POST /api/expenses` |
| Add employee | `POST /api/employees` — hash the PIN server-side |

Because every page reads through the shared helpers in `lib/types.js`, swapping
the data source doesn't touch component code.

## Responsive behaviour

- **≥1280px** — sidebar, POS checkout panel docked right and sticky
- **1024–1280px** — sidebar, checkout panel drops below the cart
- **<1024px** — sidebar becomes a bottom tab bar; tables scroll horizontally
  with sticky totals
