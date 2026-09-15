# EVOTECH — API contract

This is the complete list of what the frontend calls. Implement these and the
interface works; nothing else is needed.

- Base URL: whatever you like. The frontend reads it from `NEXT_PUBLIC_API_URL`
  (for example `http://localhost:4000/api`).
- All request and response bodies are JSON.
- Authenticated calls send `Authorization: Bearer <token>`.
- Keys are `camelCase` in JSON even though the tables are `snake_case`.
- Money is a number with two decimals, in GEL. Never a string.
- Dates in query parameters are ISO timestamps. Ranges are **half-open**:
  `from` inclusive, `to` exclusive. The frontend always sends both.
- A failure returns a non-2xx status and `{ "message": "…" }`. The frontend
  shows `message` directly, so write it for the shop owner, not for a log file.

---

## 1. Auth

### `POST /auth/pin`

The most important endpoint in the system: it signs the employee in **and**
records their arrival **and** notifies the owner, in one transaction.

```json
// request
{ "pin": "4821" }
```

```json
// 200
{
  "token": "eyJhbGciOi…",
  "user": {
    "id": "…",
    "fullName": "ნინო კაპანაძე",
    "roles": ["cashier"],
    "schedule": { "startTime": "11:00", "endTime": "19:00" }
  },
  "clockIn": {
    "at": "2026-09-13T11:07:22+04:00",
    "scheduledStart": "11:00",
    "lateMinutes": 7
  }
}
```

What the handler must do, in order:

1. Find the employee whose `pin_hash` matches. No match → `401`.
2. Employee not `active` → `403` (the frontend shows a different message).
3. Upsert today's `attendance` row. If one already exists with a `clock_in`,
   do **not** overwrite it — someone refreshing the page at 15:00 must not
   reset their morning. Return the existing row.
4. `late_minutes` = actual minus scheduled, in minutes. Negative means early.
   Store the raw number; the grace period is applied when *displaying*, so
   changing the grace setting later re-reads history consistently.
5. Write an `activity` row of kind `clock_in`.
6. If `settings.telegram_enabled`, send the message (see §9) and record it in
   `notifications`. **Send it after the transaction commits** — a Telegram
   timeout must never stop a cashier from signing in.

### `GET /auth/me`

Returns the same `user` object. Used to restore the session on refresh.

### `POST /auth/logout`

Sets `clock_out` on today's attendance row, computes `minutes_worked`, writes
a `clock_out` activity row, and sends the second Telegram message if enabled.

---

## 2. Reports

### `GET /reports/summary?from=…&to=…`

```json
{
  "revenue": 4820.50,
  "expenses": { "fixed": 1200, "stock": 2400, "oneoff": 85, "total": 3685 },
  "netProfit": 1135.50,
  "salesCount": 37,
  "itemsSold": 54,
  "avgSale": 130.28
}
```

`netProfit` depends on `settings.accounting`:

- `cash` — `revenue − (fixed + stock + oneoff)`. Simple, matches the bank.
- `cogs` — `revenue − (fixed + oneoff) − SUM(unit_cost × qty)` for sales in
  the period, using the `sale_costs` view. Stock purchases are **not**
  subtracted; the cost arrives when the item sells.

Return both shapes identically. The owner switches the mode in Settings and
the whole dashboard follows.

### `GET /reports/sales-series?from=…&to=…&bucket=hour|day|month`

```json
[
  { "bucket": "2026-09-13T09:00:00+04:00", "label": "09:00", "revenue": 240, "sales": 2 },
  { "bucket": "2026-09-13T10:00:00+04:00", "label": "10:00", "revenue": 0,   "sales": 0 }
]
```

Include empty buckets. A gap in the line should mean "we sold nothing at
11am", not "the data is missing". `label` is what the chart axis prints —
generate it server-side so both languages get a sensible format.

### `GET /reports/employee-sales?from=…&to=…`

```json
[
  {
    "employeeId": "…",
    "fullName": "ნინო კაპანაძე",
    "revenue": 1240.00,
    "salesCount": 11,
    "itemsSold": 16,
    "commission": 49.60
  }
]
```

Include every active employee, even at zero — an absent row reads as a bug.
`commission` is `revenue × commission_rate / 100` for commission staff, `null`
otherwise.

---

## 3. Products

| Method | Path | Notes |
|---|---|---|
| `GET` | `/products?search=&lowStock=true` | `search` matches name, barcode or SKU. `lowStock=true` returns `quantity <= min_stock_threshold`. |
| `GET` | `/products/lookup?code=…` | Exact barcode or SKU, else a single name match. `404` if nothing. **The till calls this on every scan — keep it under 50ms.** |
| `POST` | `/products` | Body below. Also writes `activity` kind `product_added`. |
| `PATCH` | `/products/:id` | Partial. A quantity increase should also write `activity` kind `stock_in`. |
| `DELETE` | `/products/:id` | Set `archived = true` rather than deleting; past `sale_items` reference it. |

Product shape:

```json
{
  "id": "…",
  "name": "iPhone 13 Pro Screen",
  "barcode": "4820019001",
  "sku": "SCR-IP13P",
  "category": "Spare parts",
  "subcategory": "Screens",
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "categoryId": "…", "subcategoryId": "…", "brandId": "…", "modelId": "…",
  "costPrice": 180.00,
  "sellPrice": 260.00,
  "quantity": 1,
  "minStockThreshold": 3,
  "supplierId": "…",
  "imageUrl": null
}
```

Return both the ids (the form needs them) and the plain names (the tables show
them). One join saved on every render.

### `GET /classification`

The whole tree in one call — the add-product form cascades through it in
memory rather than making four round trips while the user is typing.

```json
[
  {
    "id": "…", "name": "Spare parts",
    "subcategories": [
      {
        "id": "…", "name": "Screens",
        "brands": [
          { "id": "…", "name": "Apple",
            "models": [ { "id": "…", "name": "iPhone 13 Pro" } ] }
        ]
      }
    ]
  }
]
```

`POST /classification/categories`, `/subcategories`, `/brands`, `/models` each
take `{ name }` plus the parent id and return the created row.

### `GET /suppliers`, `POST /suppliers`

`{ id, name, phone, note }`.

---

## 4. Sales

### `POST /sales`

```json
{
  "items": [ { "productId": "…", "qty": 2, "unitPrice": 260.00 } ],
  "discount": { "mode": "percent", "value": 10 },
  "payment": { "method": "card", "bankId": "…", "tendered": null },
  "cashierId": "…"
}
```

```json
// 201
{ "id": "…", "receiptNo": 1043, "total": 468.00, "change": 0 }
```

In one transaction:

1. Re-read each product's `sell_price` and `quantity` **from the database**.
   Never trust the `unitPrice` in the request — it is there for the receipt,
   not for the arithmetic. A stale browser tab must not sell at yesterday's
   price.
2. Reject with `409` if any line exceeds stock, naming the product in
   `message`.
3. Insert `sales` + `sale_items`, snapshotting `name` and `unit_cost`.
4. Decrement `products.quantity`.
5. Write `activity` kind `sale`.

`payment.method = "card"` must carry a `bankId` when any active bank exists.
This is the customer's bank, recorded for reporting — the shop is not
processing the card here.

### `GET /sales?from=…&to=…&limit=`

List with `{ id, receiptNo, total, paymentMethod, bankName, cashierName, soldAt, itemCount }`.

---

## 5. Banks

| Method | Path | Body |
|---|---|---|
| `GET` | `/banks` | → `[{ id, name, active, sortOrder }]` |
| `POST` | `/banks` | `{ name }` → created bank |
| `PATCH` | `/banks/:id` | `{ name?, active?, sortOrder? }` |
| `DELETE` | `/banks/:id` | `409` if referenced by any sale |

On `409` the frontend falls back to `PATCH { active: false }`, so the bank
disappears from the till but old receipts keep their reference. Return the
inactive ones from `GET` too — Settings shows them struck through.

---

## 6. Expenses

| Method | Path | Notes |
|---|---|---|
| `GET` | `/expenses?from=…&to=…` | Sorted newest first |
| `POST` | `/expenses` | `{ type, description, amount, paidTo, date }` |
| `DELETE` | `/expenses/:id` | Hard delete is fine here |

`type` is `fixed`, `stock` or `oneoff`. Each write also adds an `activity` row
of kind `expense`.

---

## 7. Employees

| Method | Path | Notes |
|---|---|---|
| `GET` | `/employees` | Active first, then inactive |
| `GET` | `/employees/:id` | Single |
| `POST` | `/employees` | Hash the PIN. Reject a duplicate PIN with `409`. |
| `PATCH` | `/employees/:id` | `pin` is **optional** — absent means leave it alone |
| `PUT` | `/employees/:id/schedule` | `{ startTime, endTime }` |

Employee shape:

```json
{
  "id": "…",
  "fullName": "ნინო კაპანაძე",
  "phone": "+995 555 12 34 56",
  "active": true,
  "roles": ["cashier"],
  "schedule": { "startTime": "11:00", "endTime": "19:00" },
  "salaryModel": "commission",
  "monthlySalary": null,
  "commissionRate": 4.0
}
```

Never return `pinHash` — not even to an admin.

---

## 8. Attendance

### `GET /attendance?from=…&to=…&employeeId=…`

```json
[
  {
    "id": "…",
    "employeeId": "…",
    "fullName": "ნინო კაპანაძე",
    "date": "2026-09-13",
    "scheduledStart": "11:00",
    "scheduledEnd": "19:00",
    "clockIn": "2026-09-13T11:07:22+04:00",
    "clockOut": "2026-09-13T19:02:10+04:00",
    "lateMinutes": 7,
    "minutesWorked": 475
  }
]
```

Newest first. `clockOut` is `null` while the person is still at work, and the
table shows that as a live state rather than a blank.

### `PATCH /attendance/:id`

`{ clockIn?, clockOut?, note? }` — the owner correcting a record. Recompute
`late_minutes` on write. Admin only.

---

## 9. Settings and notifications

### `GET /settings` / `PATCH /settings`

```json
{
  "lateGraceMinutes": 5,
  "reinvestPercent": 30,
  "accounting": "cash",
  "telegram": { "enabled": true, "chatId": "123456789" }
}
```

`PATCH` accepts any subset.

### `POST /settings/telegram/test`

Sends a test message so the owner can confirm the wiring. `200` or `502`.

### `GET /notifications?limit=`

`[{ id, channel, text, delivered, sentAt }]` — the in-app record of what was
sent, so the owner can check even if they missed the phone.

### Telegram wiring

Bot token lives in the server environment (`TELEGRAM_BOT_TOKEN`), never in
the database and never in the frontend. The chat id is discovered once by
calling `getUpdates` after the owner messages the bot, then stored in
`settings.telegram_chat_id`.

Send with:

```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
{ "chat_id": "<chatId>", "text": "…", "parse_mode": "HTML" }
```

Suggested message on sign-in:

```
🟡 ნინო კაპანაძე დაიწყო მუშაობა
დრო: 11:07 (გრაფიკით 11:00)
დააგვიანა 7 წუთით
```

and on sign-out:

```
⚪️ ნინო კაპანაძე დაასრულა მუშაობა
დრო: 19:02 · ნამუშევარი 7 სთ 55 წთ
```

Keep the send out of the request's critical path. Telegram being slow is not
a reason a cashier cannot open the till.

---

## 10. Activity

### `GET /activity?limit=8`

```json
[
  { "id": "…", "kind": "sale", "description": "Receipt 1043",
    "amount": 468.00, "actorName": "ნინო კაპანაძე",
    "at": "2026-09-13T14:22:00+04:00" }
]
```

`kind` is one of `sale`, `refund`, `product_added`, `stock_in`, `expense`,
`clock_in`, `clock_out`. The frontend already has an icon and a translated
label for each.

---

## Order of work

If the backend is built in this order, the frontend comes alive in useful
pieces rather than all at once at the end:

1. `POST /auth/pin`, `GET /auth/me`, `GET /settings` — sign-in works
2. `/products`, `/products/lookup`, `/classification` — inventory and scanning
3. `/banks`, `POST /sales` — the till can take money
4. `/reports/*` — the dashboard fills in
5. `/expenses` — real profit
6. `/employees`, `/attendance`, notifications — staff tracking
