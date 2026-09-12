"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { compactMoney, money } from "@/lib/utils";

export function SalesChart({ data, periodLabel }) {
  const total = data.reduce((s, p) => s + p.revenue, 0);
  const peak = data.reduce((a, b) => (b.revenue > a.revenue ? b : a), data[0]);

  return (
    <Panel flush className="flex flex-col">
      <div className="border-b border-line p-5">
        <PanelHeader
          title="Sales dynamics"
          meta={`${periodLabel} · peak at ${peak.label} (${money(peak.revenue, {
            decimals: false,
          })})`}
          action={
            <div className="flex items-center gap-4">
              <Legend color="hsl(var(--brass))" label="Revenue" />
              <Legend color="hsl(var(--danger))" label="Expenses" />
            </div>
          }
        />
        <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-fg tnum">
          {money(total, { decimals: false })}
        </p>
      </div>

      <div className="h-[260px] w-full p-2 pr-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--brass))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--brass))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.16} />
                <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--line))" }}
              tick={{
                fill: "hsl(var(--faint))",
                fontSize: 11,
                fontFamily: "var(--font-jetbrains)",
              }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{
                fill: "hsl(var(--faint))",
                fontSize: 11,
                fontFamily: "var(--font-jetbrains)",
              }}
              tickFormatter={(v) => compactMoney(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--line-strong))" }} />

            <Area
              type="monotone"
              dataKey="expenses"
              stroke="hsl(var(--danger))"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="url(#expFill)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--brass))"
              strokeWidth={2}
              fill="url(#revFill)"
              activeDot={{
                r: 4,
                fill: "hsl(var(--brass))",
                stroke: "hsl(var(--bg))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-2xs text-muted">
      <span className="h-[2px] w-4 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;

  return (
    <div className="rounded border border-line-strong bg-elevated px-3 py-2">
      <p className="mb-1.5 font-mono text-2xs text-faint">{label}</p>
      <Row label="Revenue" value={money(revenue)} color="text-brass" />
      <Row label="Expenses" value={money(expenses)} color="text-danger" />
      <div className="mt-1.5 border-t border-line pt-1.5">
        <Row label="Net" value={money(revenue - expenses)} color="text-jade" />
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-6 text-2xs">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tnum ${color}`}>{value}</span>
    </div>
  );
}
