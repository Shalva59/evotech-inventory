"use client";

import { CalendarRange } from "lucide-react";
import { Select } from "@/components/ui/field";
import { TIME_RANGE_LABELS } from "@/lib/types";

/**
 * Single source of truth for the dashboard period. Every KPI, the chart and
 * the activity feed read from this one value.
 */
export function TimeFilter({ value, onChange }) {
  return (
    <div className="relative flex items-center">
      <CalendarRange
        className="pointer-events-none absolute left-3 z-10 h-3.5 w-3.5 text-faint"
        strokeWidth={1.8}
      />
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Reporting period"
        className="h-9 w-[150px] bg-surface pl-9 text-[13px]"
      >
        {Object.keys(TIME_RANGE_LABELS).map((r) => (
          <option key={r} value={r}>
            {TIME_RANGE_LABELS[r]}
          </option>
        ))}
      </Select>
    </div>
  );
}
