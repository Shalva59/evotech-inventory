-- ============================================================
-- EVOTECH — PostgreSQL schema
--
-- Written for the frontend in this repository. Every table here backs a
-- screen; nothing is speculative. Run against an empty database:
--
--   createdb evotech
--   psql evotech -f backend/schema.sql
--
-- Money is numeric(12,2), never float. Floating point loses tetri, and a
-- till that is four tetri out at the end of the day is a till nobody trusts.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt()

-- ------------------------------------------------------------
-- People
-- ------------------------------------------------------------

CREATE TYPE salary_model AS ENUM ('fixed', 'commission');

CREATE TABLE employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text        NOT NULL,
  phone           text,
  -- Never store the PIN itself. crypt(pin, gen_salt('bf')) on write,
  -- pin_hash = crypt($1, pin_hash) on check.
  pin_hash        text        NOT NULL,
  active          boolean     NOT NULL DEFAULT true,
  roles           text[]      NOT NULL DEFAULT '{cashier}',
  -- Same window every day, set by the owner.
  schedule_start  time        NOT NULL DEFAULT '11:00',
  schedule_end    time        NOT NULL DEFAULT '19:00',
  salary_model    salary_model NOT NULL DEFAULT 'fixed',
  monthly_salary  numeric(12,2),
  commission_rate numeric(5,2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Two people must not share a PIN, or attendance records point at the
-- wrong person. Partial index so deactivated staff can keep theirs.
CREATE UNIQUE INDEX employees_pin_unique
  ON employees (pin_hash) WHERE active;

-- ------------------------------------------------------------
-- Attendance
-- ------------------------------------------------------------

CREATE TABLE attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date        date NOT NULL,
  clock_in         timestamptz,
  clock_out        timestamptz,
  -- Copied from the employee at sign-in time, not joined at read time.
  -- If the owner changes the schedule next week, last week's lateness must
  -- not silently rewrite itself.
  scheduled_start  time NOT NULL,
  scheduled_end    time NOT NULL,
  late_minutes     integer,
  notified         boolean NOT NULL DEFAULT false,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

CREATE INDEX attendance_date_idx ON attendance (work_date DESC);

-- ------------------------------------------------------------
-- Catalogue
--
-- The shop sells accessories and repair parts, not phones. So a product
-- has two different "brands" and they must not be confused:
--   brands   — who made the accessory (Spigen, Baseus). Independent of
--              category: Baseus makes chargers, cables and cases.
--   devices  — what it fits (iPhone 15, Galaxy S24). Many-to-many: a
--              USB-C cable fits hundreds, a screwdriver set fits none.
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image       text,            -- optional thumbnail (frontend resizes to 256px)
  -- The catalogue tiles. An icon key and a colour key from the frontend's
  -- fixed sets, because a shop owner will not find a photograph for
  -- "20W chargers" and a tile with nothing in it looks broken.
  icon        text NOT NULL DEFAULT 'package',
  color       text,
  sort_order  integer NOT NULL DEFAULT 0   -- owner drags the tiles around
);

CREATE TABLE subcategories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        text NOT NULL,
  UNIQUE (category_id, name)
);

-- A brand is a name and a logo. Country, website and notes were tried and
-- removed: nobody in a shop looks them up, and every unused field is one
-- more blank box in the way of entering the next brand.
CREATE TABLE brands (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo text
);

CREATE TABLE devices (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE,   -- "iPhone 15 Pro"
  maker text NOT NULL DEFAULT '' -- "Apple"; groups the list
);

CREATE TABLE suppliers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  phone          text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  note           text NOT NULL DEFAULT ''
);

CREATE TABLE products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  barcode             text,
  sku                 text,
  -- RESTRICT, not CASCADE: deleting a category must never silently take
  -- products with it. The API answers 409 and the owner moves them first.
  category_id         uuid REFERENCES categories(id)    ON DELETE RESTRICT,
  subcategory_id      uuid REFERENCES subcategories(id) ON DELETE RESTRICT,
  brand_id            uuid REFERENCES brands(id)        ON DELETE RESTRICT,
  supplier_id         uuid REFERENCES suppliers(id)     ON DELETE RESTRICT,
  -- Weighted average across every receipt of stock. See POST /receive.
  cost_price          numeric(12,2) NOT NULL DEFAULT 0,
  sell_price          numeric(12,2) NOT NULL DEFAULT 0,
  quantity            integer NOT NULL DEFAULT 0,
  min_stock_threshold integer NOT NULL DEFAULT 0,
  image_url           text,
  archived            boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Barcodes are unique among live products only, so an archived item's
-- code can be reused by its replacement.
CREATE UNIQUE INDEX products_barcode_live ON products (barcode) WHERE NOT archived;
CREATE UNIQUE INDEX products_sku_live     ON products (sku)     WHERE NOT archived AND sku IS NOT NULL;
CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
CREATE INDEX products_low_stock_idx ON products (quantity) WHERE NOT archived;

-- Compatibility. Deleting a device removes it from lists; products stay.
CREATE TABLE product_devices (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  device_id  uuid NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
  PRIMARY KEY (product_id, device_id)
);

CREATE INDEX product_devices_device_idx ON product_devices (device_id);

-- Every arrival of goods, kept so cost history can be audited later.
CREATE TABLE stock_receipts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id),
  supplier_id  uuid REFERENCES suppliers(id),
  qty          integer NOT NULL CHECK (qty > 0),
  unit_cost    numeric(12,2) NOT NULL,
  expense_id   uuid,           -- set when "record as expense" was ticked
  received_by  uuid REFERENCES employees(id),
  received_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Payment methods the customer can use
-- ------------------------------------------------------------

CREATE TABLE banks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  active     boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The shop's starting two. Everything else the owner adds from Settings.
INSERT INTO banks (name, sort_order) VALUES
  ('TBC Bank', 1),
  ('Bank of Georgia', 2);

-- ------------------------------------------------------------
-- Sales
-- ------------------------------------------------------------

CREATE TYPE payment_method AS ENUM ('cash', 'card');
CREATE TYPE discount_mode  AS ENUM ('percent', 'fixed');

CREATE TABLE sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      bigserial UNIQUE,
  cashier_id      uuid REFERENCES employees(id),
  subtotal        numeric(12,2) NOT NULL,
  discount_mode   discount_mode,
  discount_value  numeric(12,2),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL,
  payment_method  payment_method NOT NULL,
  -- Which bank the customer's card was from. Null for cash.
  bank_id         uuid REFERENCES banks(id),
  cash_tendered   numeric(12,2),
  change_given    numeric(12,2),
  sold_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_sold_at_idx  ON sales (sold_at DESC);
CREATE INDEX sales_cashier_idx  ON sales (cashier_id, sold_at DESC);

CREATE TABLE sale_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id),
  -- Snapshot of the product at the moment of sale. Renaming or repricing a
  -- product later must not rewrite last month's receipts.
  name        text NOT NULL,
  qty         integer NOT NULL CHECK (qty > 0),
  unit_price  numeric(12,2) NOT NULL,
  unit_cost   numeric(12,2) NOT NULL,
  line_total  numeric(12,2) NOT NULL
);

CREATE INDEX sale_items_sale_idx ON sale_items (sale_id);

-- ------------------------------------------------------------
-- Expenses
-- ------------------------------------------------------------

CREATE TYPE expense_type AS ENUM ('fixed', 'stock', 'oneoff');

CREATE TABLE expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         expense_type NOT NULL,
  description  text NOT NULL,
  amount       numeric(12,2) NOT NULL,
  paid_to      text,
  spent_on     date NOT NULL DEFAULT current_date,
  recorded_by  uuid REFERENCES employees(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_date_idx ON expenses (spent_on DESC);

-- ------------------------------------------------------------
-- Activity feed and notification log
-- ------------------------------------------------------------

CREATE TABLE activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL,  -- sale | refund | product_added | stock_in |
                              -- expense | clock_in | clock_out
  description text,
  amount      numeric(12,2),
  actor_id    uuid REFERENCES employees(id),
  happened_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_recent_idx ON activity (happened_at DESC);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel    text NOT NULL DEFAULT 'telegram',
  text       text NOT NULL,
  delivered  boolean NOT NULL DEFAULT false,
  error      text,
  sent_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Settings — a single row the whole shop shares
-- ------------------------------------------------------------

CREATE TABLE settings (
  id                  boolean PRIMARY KEY DEFAULT true CHECK (id),
  late_grace_minutes  integer NOT NULL DEFAULT 5,
  reinvest_percent    integer NOT NULL DEFAULT 30,
  accounting          text    NOT NULL DEFAULT 'cash'
                              CHECK (accounting IN ('cash', 'cogs')),
  telegram_enabled    boolean NOT NULL DEFAULT false,
  telegram_chat_id    text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (id) VALUES (true);

-- ------------------------------------------------------------
-- Reporting helpers
-- ------------------------------------------------------------

-- Cost of goods sold, per sale. Needed only if settings.accounting = 'cogs'.
CREATE OR REPLACE VIEW sale_costs AS
  SELECT s.id       AS sale_id,
         s.sold_at,
         SUM(i.unit_cost * i.qty) AS cogs
  FROM sales s
  JOIN sale_items i ON i.sale_id = s.id
  GROUP BY s.id, s.sold_at;

-- Everything the dashboard needs for a period, in one place. Callers pass
-- half-open bounds: sold_at >= from AND sold_at < to.
CREATE OR REPLACE FUNCTION report_summary(p_from timestamptz, p_to timestamptz)
RETURNS TABLE (
  revenue        numeric,
  sales_count    bigint,
  items_sold     bigint,
  fixed_expense  numeric,
  stock_expense  numeric,
  oneoff_expense numeric
) LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE((SELECT SUM(total) FROM sales
              WHERE sold_at >= p_from AND sold_at < p_to), 0),
    (SELECT COUNT(*) FROM sales
              WHERE sold_at >= p_from AND sold_at < p_to),
    COALESCE((SELECT SUM(i.qty) FROM sale_items i
              JOIN sales s ON s.id = i.sale_id
              WHERE s.sold_at >= p_from AND s.sold_at < p_to), 0),
    COALESCE((SELECT SUM(amount) FROM expenses
              WHERE type = 'fixed'
                AND spent_on >= p_from::date AND spent_on < p_to::date), 0),
    COALESCE((SELECT SUM(amount) FROM expenses
              WHERE type = 'stock'
                AND spent_on >= p_from::date AND spent_on < p_to::date), 0),
    COALESCE((SELECT SUM(amount) FROM expenses
              WHERE type = 'oneoff'
                AND spent_on >= p_from::date AND spent_on < p_to::date), 0);
$$;
