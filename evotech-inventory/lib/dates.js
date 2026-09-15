/**
 * Every figure in this app is "money that moved between two moments".
 * This file is the only place that decides where those two moments fall,
 * so the dashboard, expenses page and employee report can never disagree
 * about what "this month" means.
 *
 * Ranges are half-open: `from` is inclusive, `to` is exclusive. That kills
 * the classic off-by-one where a sale at 23:59:59 vanishes from the day.
 */

export const RANGE_KINDS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  DAY: "day",
  PICKED_MONTH: "pickedMonth",
  YEAR: "year",
  CUSTOM: "custom",
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-first, which is how a Georgian shop week actually runs. */
function startOfWeek(date) {
  const d = startOfDay(date);
  const weekday = (d.getDay() + 6) % 7;
  return addDays(d, -weekday);
}

function startOfMonth(year, month) {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

/**
 * Builds the {from, to} pair the API expects.
 *
 * @param {object} spec
 * @param {string} spec.kind   one of RANGE_KINDS
 * @param {Date=}  spec.date   anchor day, for DAY and CUSTOM
 * @param {Date=}  spec.endDate end of a CUSTOM range
 * @param {number=} spec.year
 * @param {number=} spec.month 0-indexed
 */
export function resolveRange(spec, now = new Date()) {
  const { kind } = spec;

  if (kind === RANGE_KINDS.TODAY) {
    const from = startOfDay(now);
    return iso(from, addDays(from, 1));
  }

  if (kind === RANGE_KINDS.WEEK) {
    const from = startOfWeek(now);
    return iso(from, addDays(from, 7));
  }

  if (kind === RANGE_KINDS.MONTH) {
    const from = startOfMonth(now.getFullYear(), now.getMonth());
    return iso(from, startOfMonth(now.getFullYear(), now.getMonth() + 1));
  }

  if (kind === RANGE_KINDS.DAY) {
    const from = startOfDay(spec.date ?? now);
    return iso(from, addDays(from, 1));
  }

  if (kind === RANGE_KINDS.PICKED_MONTH) {
    const year = spec.year ?? now.getFullYear();
    const month = spec.month ?? now.getMonth();
    return iso(startOfMonth(year, month), startOfMonth(year, month + 1));
  }

  if (kind === RANGE_KINDS.YEAR) {
    const year = spec.year ?? now.getFullYear();
    return iso(startOfMonth(year, 0), startOfMonth(year + 1, 0));
  }

  if (kind === RANGE_KINDS.CUSTOM) {
    const from = startOfDay(spec.date ?? now);
    const to = addDays(startOfDay(spec.endDate ?? spec.date ?? now), 1);
    return iso(from, to);
  }

  const from = startOfDay(now);
  return iso(from, addDays(from, 1));
}

function iso(from, to) {
  return { from: from.toISOString(), to: to.toISOString() };
}

/** The calendar grid: six weeks of cells, Monday first, with padding days. */
export function monthGrid(year, month) {
  const first = startOfMonth(year, month);
  const lead = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(first, i - lead);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      isToday: isSameDay(date, new Date()),
    });
  }
  return cells;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isFuture(date) {
  return startOfDay(date) > startOfDay(new Date());
}

export function isBetween(date, from, to) {
  const t = startOfDay(date).getTime();
  return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime();
}

/** `2026-09-13` — the shape the backend stores attendance dates in. */
export function toDateKey(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "11:07" from an ISO timestamp, or an em dash when nothing was recorded. */
export function clockTime(iso24) {
  if (!iso24) return "—";
  const d = new Date(iso24);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Minutes between "11:00" and an ISO arrival. Negative means early. */
export function minutesLate(scheduledStart, arrivedIso) {
  if (!scheduledStart || !arrivedIso) return null;
  const arrived = new Date(arrivedIso);
  const [h, m] = scheduledStart.split(":").map(Number);
  const due = new Date(arrived);
  due.setHours(h, m, 0, 0);
  return Math.round((arrived - due) / 60000);
}

export function formatDuration(minutes) {
  if (minutes == null) return "—";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  return `${sign}${h}h ${String(m).padStart(2, "0")}m`;
}

export const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Years offered in the picker: the shop cannot have sold anything in 2031. */
export function selectableYears(back = 4) {
  const current = new Date().getFullYear();
  return Array.from({ length: back + 1 }, (_, i) => current - back + i);
}
