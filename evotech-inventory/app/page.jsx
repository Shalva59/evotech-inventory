"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { DateFilter } from "@/components/filters/DateFilter";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useApi } from "@/lib/hooks";
import { reports, products, activity, settings as settingsApi } from "@/lib/api";
import { RANGE_KINDS, resolveRange } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/state";

export default function DashboardPage() {
  const { t } = useI18n();
  const [spec, setSpec] = useState({ kind: RANGE_KINDS.TODAY });

  // One resolved range feeds every query below, so the KPI cards, the chart
  // and the expense split can never describe different periods.
  const range = useMemo(() => resolveRange(spec), [spec]);
  const key = `${range.from}|${range.to}`;

  const summary = useApi(() => reports.summary(range), [key]);
  const series = useApi(() => reports.salesSeries(range), [key]);
  const lowStock = useApi(() => products.lowStock(), []);
  const feed = useApi(() => activity.list(8), []);
  const config = useApi(() => settingsApi.get(), []);

  async function setReinvest(percent) {
    config.setData((current) => ({ ...current, reinvestPercent: percent }));
    try {
      await settingsApi.update({ reinvestPercent: percent });
    } catch {
      config.reload();
    }
  }

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        actions={<DateFilter value={spec} onChange={setSpec} />}
      />

      <main className="space-y-4 p-5">
        {summary.error ? (
          <div className="rounded border border-line bg-surface">
            <ErrorState error={summary.error} onRetry={summary.reload} />
          </div>
        ) : (
          <KpiRow
            summary={summary.data}
            loading={summary.loading}
            reinvestPercent={config.data?.reinvestPercent}
            onReinvestChange={setReinvest}
          />
        )}

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <SalesChart query={series} />
          <LowStockAlerts query={lowStock} />
        </div>

        <RecentActivity query={feed} />
      </main>
    </>
  );
}
