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
import { Async, EmptyState, Skeleton } from "@/components/ui/state";
import { useI18n } from "@/lib/i18n";
import { money, compactMoney } from "@/lib/utils";

/**
 * Revenue over the selected period. The backend decides the bucket (hour,
 * day or month) so the axis never has four hundred ticks on it.
 */
export function SalesChart({ query }) {
  const { t } = useI18n();

  return (
    <Panel flush className="flex min-h-[260px] flex-col">
      <PanelHeader title={t("dashboard.salesChart")} className="border-b border-line px-5 py-3.5" />
      <div className="flex-1 p-2">
        <Async
          query={query}
          isEmpty={(data) => !data?.length || data.every((point) => !point.revenue)}
          skeleton={<Skeleton className="m-3 h-[200px]" />}
          empty={
            <EmptyState title={t("dashboard.noSalesYet")} hint={t("dashboard.noSalesHint")} />
          }
        >
          {(data) => <Chart data={data} />}
        </Async>
      </div>
    </Panel>
  );
}

function Chart({ data }) {
  const { t } = useI18n();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -14 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brass))" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(var(--brass))" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="hsl(var(--line))" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--faint))", fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={54}
          tick={{ fill: "hsl(var(--faint))", fontSize: 10 }}
          tickFormatter={compactMoney}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--line-strong))" }}
          contentStyle={{
            background: "hsl(var(--elevated))",
            border: "1px solid hsl(var(--line-strong))",
            borderRadius: 4,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--muted))", fontSize: 11 }}
          formatter={(value) => [money(value), t("dashboard.revenue")]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--brass))"
          strokeWidth={1.6}
          fill="url(#revenueFill)"
          dot={false}
          activeDot={{ r: 3, fill: "hsl(var(--brass))", stroke: "hsl(var(--bg))", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
