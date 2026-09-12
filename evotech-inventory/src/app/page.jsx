"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { TimeFilter } from "@/components/dashboard/TimeFilter";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { TIME_RANGE_LABELS } from "@/lib/types";
import { ACTIVITY, PRODUCTS, SALES_SERIES, periodTotals } from "@/lib/mock-data";

/** Stand-in for period-over-period comparison until the API supplies it. */
const DELTAS = {
  today: { revenue: 12.4, expenses: -4.2, netProfit: 18.1 },
  week: { revenue: 8.6, expenses: 11.3, netProfit: 4.9 },
  month: { revenue: -2.1, expenses: 6.8, netProfit: -9.4 },
};

export default function DashboardPage() {
  const [range, setRange] = useState("week");

  const totals = useMemo(() => periodTotals(range), [range]);
  const series = SALES_SERIES[range];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="EVOTECH · Pekini Ave. branch">
        <TimeFilter value={range} onChange={setRange} />
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
          Export
        </Button>
      </PageHeader>

      <main className="flex-1 space-y-4 p-5 sm:p-6">
        <KpiRow
          revenue={totals.revenue}
          expenses={totals.expenses}
          netProfit={totals.netProfit}
          deltas={DELTAS[range]}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SalesChart data={series} periodLabel={TIME_RANGE_LABELS[range]} />
          </div>
          <LowStockAlerts products={PRODUCTS} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentActivity items={ACTIVITY} />
          </div>
        </div>
      </main>
    </>
  );
}
