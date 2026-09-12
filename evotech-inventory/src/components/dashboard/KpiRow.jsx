"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { cn, money } from "@/lib/utils";

/** Share of net profit the store sets aside to buy new stock. */
const REINVEST_OPTIONS = [20, 30, 40, 50];

export function KpiRow({ revenue, expenses, netProfit, deltas }) {
  const [reinvestPct, setReinvestPct] = useState(30);
  const reinvestBudget = Math.max(0, netProfit) * (reinvestPct / 100);
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Total revenue"
        value={money(revenue, { decimals: false })}
        delta={deltas?.revenue}
        deltaGoodWhen="up"
        note="All completed sales and repair jobs"
      />
      <Kpi
        label="Total expenses"
        value={money(expenses, { decimals: false })}
        delta={deltas?.expenses}
        deltaGoodWhen="down"
        note="Fixed, stock purchases, and one-time"
      />
      <Kpi
        label="Net profit"
        value={money(netProfit, { decimals: false })}
        delta={deltas?.netProfit}
        deltaGoodWhen="up"
        note={`${margin.toFixed(1)}% margin on revenue`}
        emphasis
      />

      {/* Reinvestment budget — derived, and adjustable in place */}
      <div className="bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <PiggyBank className="h-3.5 w-3.5 text-brass" strokeWidth={1.8} />
            Reinvestment budget
          </span>
        </div>
        <p className="mt-2 font-mono text-[28px] font-semibold leading-none tracking-tight text-brass tnum">
          {money(reinvestBudget, { decimals: false })}
        </p>
        <div className="mt-3 flex items-center gap-1">
          {REINVEST_OPTIONS.map((pct) => (
            <button
              key={pct}
              onClick={() => setReinvestPct(pct)}
              aria-pressed={pct === reinvestPct}
              className={cn(
                "h-6 rounded-sm px-2 font-mono text-2xs transition-colors",
                pct === reinvestPct
                  ? "bg-brass text-brass-fg"
                  : "border border-line text-faint hover:border-brass hover:text-brass"
              )}
            >
              {pct}%
            </button>
          ))}
          <span className="ml-1 text-2xs text-faint">of net profit</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, deltaGoodWhen, note, emphasis }) {
  const up = (delta ?? 0) >= 0;
  const good = deltaGoodWhen === "up" ? up : !up;

  return (
    <div className="bg-surface p-5">
      <span className="text-[13px] text-muted">{label}</span>
      <div className="mt-2 flex items-baseline gap-2.5">
        <p
          className={cn(
            "font-mono text-[28px] font-semibold leading-none tracking-tight tnum",
            emphasis ? "text-jade" : "text-fg"
          )}
        >
          {value}
        </p>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 font-mono text-2xs tnum",
              good ? "text-jade" : "text-danger"
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} />
            ) : (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2.2} />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-2.5 text-2xs text-faint">{note}</p>
    </div>
  );
}
