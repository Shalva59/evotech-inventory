# EVOTECH

ERP and point of sale for an electronics retail and mobile-repair shop.
Next.js frontend. All data comes from a PostgreSQL backend over HTTP — there
is no mock data anywhere in this repository.

## Running it

```bash
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at the backend
npm run dev
```

`.env.local` ships with demo mode on, so it runs immediately with no server.

## Demo mode

`NEXT_PUBLIC_DEMO=true` routes every API call to `lib/local-backend.js`, which
keeps the data in the browser. The whole system works: add products, add staff,
ring up sales, watch the dashboard, the chart and the profit equation respond.

It is not sample data — the store starts empty and every figure is arithmetic
on what you entered. The only seeded rows are the two banks, which are
configuration rather than records. Settings has a button to wipe it.

`NEXT_PUBLIC_AUTH_DISABLED=true` also ships on, so the PIN screen is skipped.
Once you have added an employee with a PIN, set it to `false` and restart to
try the real sign-in, attendance and lateness flow.

When the backend is ready, set `NEXT_PUBLIC_DEMO=false` and point
`NEXT_PUBLIC_API_URL` at it. Nothing else changes — the local store implements
the same function names and shapes as the HTTP client.

## For the backend developer

Two files, both in `backend/`:

- `schema.sql` — the PostgreSQL schema. Run it against an empty database.
- `API.md` — every endpoint the frontend calls, with request and response
  shapes, and the transactional rules that matter (sign-in, checkout).

Build them in the order listed at the bottom of `API.md` and the interface
comes alive in usable pieces.

## What the system starts as

Empty. No products, no staff, no sales. The first steps are:

1. Add employees (`/employees/new`) — each gets a 4-digit PIN and working hours
2. Add products (`/inventory/new`)
3. Sign in at the till with a PIN and sell something

The dashboard shows zeros until then.

## Screens

| Route | What it does |
|---|---|
| `/login` | PIN pad. Signing in records the arrival time and notifies the owner. |
| `/` | Revenue, expenses, net profit, reinvestment budget, sales chart, low stock, activity |
| `/pos` | Scanner, cart, discount, cash or card with the customer's bank |
| `/inventory` | Product table, category tree on the left, add/edit in a modal, receive stock |
| `/inventory/categories` | Category cards with their subcategories; open one to manage it, drag to reorder |
| `/inventory/brands` | Accessory brands — name and logo |
| `/inventory/devices` | The phones and laptops products fit |
| `/inventory/suppliers` | Who the shop buys from |
| `/expenses` | Fixed, stock and one-off spending; live profit equation |
| `/employees` | Staff, their hours, and what each of them sold in the period |
| `/employees/[id]` | One person: sales, commission, attendance history, schedule editor |
| `/attendance` | Who arrived when, against their schedule |
| `/settings` | Banks, grace period, Telegram, accounting basis, language |

## The catalogue

The shop sells accessories and repair parts, not phones, so a product carries
two different ideas that are easy to confuse:

- **Brand** — who made the accessory: Spigen, Baseus. Independent of category,
  because Baseus makes chargers, cables and cases alike.
- **Devices** — what it fits: iPhone 15, Galaxy S24. Zero, one, or many.
  Searching "iPhone 15" in Inventory returns everything that fits it.

The add-product window never closes on a stray click, only on Cancel or Save.
Every dropdown has a "+" to create a missing category, brand or supplier
inline. **Save and add next** keeps category, brand, supplier and devices and
clears the rest, for entering a box of twenty similar items in a row.

**Receive stock** adds quantity, re-averages the cost price across old and new
stock, and — unless the goods came on credit — books the payment as a stock
expense automatically.

Categories are browsed as tiles with an icon and a colour rather than a
photograph, since nobody will go hunting for a picture of "20W chargers" and
a tile with nothing in it makes the whole page look unfinished. A photo can
be added and becomes the tile's background. Tiles drag into whatever order
the shop actually uses.

Opening a tile shows its subcategories and a "show all" button; both lead to
the product list with the filter in the URL, so the back button works and a
filtered view can be bookmarked. The same filter is available as a tree
beside the product list, with one control to open or close every branch.

Products stay a table. A card grid was tried and removed: prices, cost and
stock are numbers to compare down a column, and a wall of photographs makes
that harder rather than easier.

Category artwork is always contained inside a fixed square rather than filling
the card. Shop logos are high-contrast by design, and a full-bleed red logo
turns a card into a billboard with unreadable text on it. The category colour
survives as a tinted square and a hairline on hover.

Images are resized in the browser to 256px before they are stored.

## The period control

Every money screen carries the same filter. Three quick buttons — today, this
week, this month — plus a calendar for a specific day, a specific month, a
specific year, or a custom range.

All of it resolves through one function, `resolveRange()` in `lib/dates.js`,
which returns a half-open `{ from, to }` pair. Every API call takes that same
pair, so the dashboard, the expense list and the employee report can never
disagree about what "this month" means.

## Attendance

The owner sets one daily window per employee — 11:00 to 19:00 — editable at
any time from the employee's page. When they enter their PIN, the backend
writes the arrival, compares it with the schedule, and sends the owner a
Telegram message.

Lateness is stored raw and judged at display time against
`settings.lateGraceMinutes`. Changing the grace period re-reads history
consistently rather than rewriting it.

Telegram is the notification channel because it is free, instant, and takes
five minutes to set up. The backend's send is one function; adding SMS or
WhatsApp later means writing a second one, not changing the schema.

## Language

Georgian and English, switchable from the sidebar or Settings. The choice is
stored per device, so a shared till and the owner's laptop can differ.

Archivo carries the Latin glyphs, Noto Sans Georgian the Georgian ones; the
browser falls through per character, so mixed strings stay consistent. Georgian
gets slightly looser line-height, since it has no uppercase and carries more
vertical detail than the tight tracking Archivo wants.

## Accounting: cash or COGS

Settings offers two ways to count stock purchases.

**Cash basis** subtracts a purchase when the supplier is paid. Simple, matches
the bank account. The downside: a month with a big restock looks unprofitable
even though the shop is holding valuable stock.

**COGS basis** subtracts a product's cost only when it sells. Smoother and more
accurate.

Every `sale_item` snapshots `unit_cost`, so switching between the two is a
reporting change, not a migration.

## Design

| | |
|---|---|
| Surfaces | Slate-blue blacks, five steps, depth from hairlines rather than shadows |
| Accent | Brass `hsl(38 55% 52%)` — solder, contacts, screwdriver bits |
| Jade | Reserved for committing money: the checkout button, net profit |
| Red | Reserved for genuine stop-work: out of stock, lateness past grace, negative margin |
| Type | Archivo + Noto Sans Georgian for interface, JetBrains Mono for every number |
| Radius | 4px, one hairline border, no drop shadows |

Numbers use tabular figures everywhere (`.tnum`). In a till, a column of
prices that does not line up is a functional defect.

## Structure

```
app/            routes
components/
  ui/           button, field, panel, state (loading / error / empty)
  shell/        sidebar, mobile nav, page header
  filters/      DateFilter — the calendar
  dashboard/    KPI row, chart, low stock, activity
  pos/          scanner, cart, checkout
  forms/        product, employee
  employees/    attendance table, schedule editor
lib/
  api.js        every backend call, in one file
  hooks.js      useApi, useAction, useDebounced
  dates.js      range maths and the calendar grid
  auth.jsx      PIN session and route guard
  i18n/         ka.js, en.js, provider
backend/
  schema.sql    PostgreSQL schema
  API.md        endpoint contract
```

`lib/api.js` is the only file that knows a URL. When the backend renames an
endpoint, one file changes.
