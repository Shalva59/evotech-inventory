"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  RANGE_KINDS,
  isFuture,
  isSameDay,
  isBetween,
  monthGrid,
  selectableYears,
} from "@/lib/dates";

const QUICK = [RANGE_KINDS.TODAY, RANGE_KINDS.WEEK, RANGE_KINDS.MONTH];

/**
 * The period control that sits at the top of every money screen.
 *
 * Three quick buttons cover the questions asked twenty times a day; the
 * calendar behind them answers "what did we take on the 14th of March".
 * Both write the same {kind, …} object, so the page below only ever calls
 * resolveRange once.
 */
export function DateFilter({ value, onChange, className }) {
  const { t, dict, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isQuick = QUICK.includes(value.kind);

  return (
    <div ref={wrapRef} className={cn("relative flex items-center gap-2", className)}>
      <div className="inline-flex rounded border border-line bg-bg p-0.5">
        {QUICK.map((kind) => {
          const active = value.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => {
                onChange({ kind });
                setOpen(false);
              }}
              aria-pressed={active}
              className={cn(
                "h-8 whitespace-nowrap rounded-sm px-3 text-[13px] transition-colors",
                active ? "bg-brass text-brass-fg" : "text-muted hover:bg-elevated hover:text-fg"
              )}
            >
              {t(`range.${kind === RANGE_KINDS.TODAY ? "today" : kind}`)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded border px-3 text-[13px] transition-colors",
          isQuick
            ? "border-line bg-bg text-muted hover:border-line-strong hover:text-fg"
            : "border-brass bg-brass-dim/40 text-brass"
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span className="max-w-[22ch] truncate">
          {isQuick ? t("range.pick") : describe(value, dict, lang)}
        </span>
        {!isQuick && (
          <X
            className="h-3.5 w-3.5 shrink-0 opacity-70 hover:opacity-100"
            strokeWidth={2}
            onClick={(event) => {
              event.stopPropagation();
              onChange({ kind: RANGE_KINDS.TODAY });
            }}
          />
        )}
      </button>

      {open && (
        <CalendarPanel
          value={value}
          onPick={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const MODES = [
  { id: RANGE_KINDS.DAY, label: "range.day" },
  { id: RANGE_KINDS.PICKED_MONTH, label: "range.monthMode" },
  { id: RANGE_KINDS.YEAR, label: "range.year" },
  { id: RANGE_KINDS.CUSTOM, label: "range.custom" },
];

function CalendarPanel({ value, onPick }) {
  const { t, dict } = useI18n();
  const today = new Date();

  const [mode, setMode] = useState(
    MODES.some((m) => m.id === value.kind) ? value.kind : RANGE_KINDS.DAY
  );
  const [cursor, setCursor] = useState(() => ({
    year: value.year ?? (value.date ? new Date(value.date).getFullYear() : today.getFullYear()),
    month: value.month ?? (value.date ? new Date(value.date).getMonth() : today.getMonth()),
  }));

  // Two-click period selection: first click sets the start, second the end.
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);

  function step(delta) {
    setCursor((c) => {
      const month = c.month + delta;
      if (month < 0) return { year: c.year - 1, month: 11 };
      if (month > 11) return { year: c.year + 1, month: 0 };
      return { ...c, month };
    });
  }

  function pickDay(date) {
    if (isFuture(date)) return;

    if (mode === RANGE_KINDS.CUSTOM) {
      if (!anchor) {
        setAnchor(date);
        return;
      }
      const [start, end] = anchor <= date ? [anchor, date] : [date, anchor];
      onPick({ kind: RANGE_KINDS.CUSTOM, date: start, endDate: end });
      setAnchor(null);
      return;
    }

    onPick({ kind: RANGE_KINDS.DAY, date });
  }

  const showsGrid = mode === RANGE_KINDS.DAY || mode === RANGE_KINDS.CUSTOM;

  return (
    <div className="absolute right-0 top-11 z-50 w-[292px] rounded border border-line-strong bg-surface p-3">
      <div className="mb-3 grid grid-cols-4 gap-px rounded border border-line bg-line p-px">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setAnchor(null);
            }}
            className={cn(
              "h-7 rounded-sm text-2xs transition-colors",
              mode === m.id ? "bg-brass text-brass-fg" : "bg-surface text-muted hover:text-fg"
            )}
          >
            {t(m.label)}
          </button>
        ))}
      </div>

      {showsGrid && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-elevated hover:text-fg"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <span className="text-[13px] text-fg">
              {dict.range.months[cursor.month]} {cursor.year}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={cursor.year === today.getFullYear() && cursor.month >= today.getMonth()}
              className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-elevated hover:text-fg disabled:opacity-25 disabled:hover:bg-transparent"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {dict.range.weekdays.map((day) => (
              <span key={day} className="py-1 text-center text-[10px] text-faint">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5" onMouseLeave={() => setHover(null)}>
            {monthGrid(cursor.year, cursor.month).map((cell, i) => {
              const disabled = isFuture(cell.date);
              const selected =
                value.date && value.kind === RANGE_KINDS.DAY && isSameDay(cell.date, new Date(value.date));

              const rangeEnd = hover ?? value.endDate;
              const inRange =
                mode === RANGE_KINDS.CUSTOM &&
                ((anchor && rangeEnd && isBetween(cell.date, min(anchor, rangeEnd), max(anchor, rangeEnd))) ||
                  (!anchor &&
                    value.kind === RANGE_KINDS.CUSTOM &&
                    value.date &&
                    value.endDate &&
                    isBetween(cell.date, new Date(value.date), new Date(value.endDate))));

              const isAnchor = anchor && isSameDay(cell.date, anchor);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(cell.date)}
                  onMouseEnter={() => anchor && setHover(cell.date)}
                  className={cn(
                    "tnum h-8 rounded-sm text-[13px] transition-colors",
                    !cell.inMonth && "text-faint/45",
                    cell.inMonth && "text-fg",
                    disabled && "cursor-not-allowed text-faint/25 hover:bg-transparent",
                    !disabled && "hover:bg-elevated",
                    inRange && "bg-brass-dim text-brass",
                    (selected || isAnchor) && "bg-brass text-brass-fg hover:bg-brass",
                    cell.isToday && !selected && !isAnchor && "ring-1 ring-inset ring-line-strong"
                  )}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {mode === RANGE_KINDS.CUSTOM && (
            <p className="mt-2 text-center text-[10px] text-faint">
              {anchor ? dict.range.to : `${dict.range.day} 1 → ${dict.range.day} 2`}
            </p>
          )}
        </>
      )}

      {mode === RANGE_KINDS.PICKED_MONTH && (
        <>
          <YearStepper
            year={cursor.year}
            onChange={(year) => setCursor((c) => ({ ...c, year }))}
          />
          <div className="grid grid-cols-3 gap-1">
            {dict.range.monthsShort.map((label, index) => {
              const disabled =
                cursor.year > today.getFullYear() ||
                (cursor.year === today.getFullYear() && index > today.getMonth());
              const selected =
                value.kind === RANGE_KINDS.PICKED_MONTH &&
                value.year === cursor.year &&
                value.month === index;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onPick({ kind: RANGE_KINDS.PICKED_MONTH, year: cursor.year, month: index })
                  }
                  className={cn(
                    "h-9 rounded-sm text-[13px] transition-colors",
                    selected
                      ? "bg-brass text-brass-fg"
                      : "text-fg hover:bg-elevated disabled:text-faint/30 disabled:hover:bg-transparent"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === RANGE_KINDS.YEAR && (
        <div className="grid grid-cols-3 gap-1">
          {selectableYears().map((year) => {
            const selected = value.kind === RANGE_KINDS.YEAR && value.year === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => onPick({ kind: RANGE_KINDS.YEAR, year })}
                className={cn(
                  "tnum h-9 rounded-sm text-[13px] transition-colors",
                  selected ? "bg-brass text-brass-fg" : "text-fg hover:bg-elevated"
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function YearStepper({ year, onChange }) {
  const thisYear = new Date().getFullYear();
  return (
    <div className="mb-2 flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(year - 1)}
        className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-elevated hover:text-fg"
        aria-label="Previous year"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <span className="tnum text-[13px] text-fg">{year}</span>
      <button
        type="button"
        onClick={() => onChange(year + 1)}
        disabled={year >= thisYear}
        className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-elevated hover:text-fg disabled:opacity-25"
        aria-label="Next year"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function min(a, b) {
  return a <= b ? a : b;
}
function max(a, b) {
  return a >= b ? a : b;
}

/** Human label for whatever period is selected. */
export function describe(spec, dict, lang = "ka") {
  const loc = lang === "ka" ? "ka-GE" : "en-GB";
  const fmt = (date) =>
    new Date(date).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });

  switch (spec.kind) {
    case RANGE_KINDS.DAY:
      return fmt(spec.date);
    case RANGE_KINDS.PICKED_MONTH:
      return `${dict.range.months[spec.month]} ${spec.year}`;
    case RANGE_KINDS.YEAR:
      return String(spec.year);
    case RANGE_KINDS.CUSTOM:
      return `${fmt(spec.date)} ${dict.range.to} ${fmt(spec.endDate)}`;
    case RANGE_KINDS.WEEK:
      return dict.range.week;
    case RANGE_KINDS.MONTH:
      return dict.range.month;
    default:
      return dict.range.today;
  }
}
