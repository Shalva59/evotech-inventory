"use client";

import { useState } from "react";
import { cn, compactMoney } from "@/lib/utils";
import { Money } from "@/components/ui/money";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/state";

const REINVEST_OPTIONS = [20, 30, 40, 50];

/**
 * Four figures, in the order an owner asks for them: what came in, what went
 * out, what is left, and what of that can safely go back into stock.
 *
 * The cards share a single hairline grid rather than four floating panels —
 * these numbers are one sentence, not four unrelated facts.
 */
export function KpiRow({ summary, loading, reinvestPercent, onReinvestChange }) {
  const { t } = useI18n();
  const [localPct, setLocalPct] = useState(reinvestPercent ?? 30);
  const pct = reinvestPercent ?? localPct;

  const revenue = summary?.revenue ?? 0;
  const expenses = summary?.expenses?.total ?? 0;
  const net = summary?.netProfit ?? revenue - expenses;
  // A loss leaves nothing to reinvest. Clamping at zero stops the dashboard
  // suggesting a restock budget out of money that does not exist.
  const reinvest = Math.max(0, net) * (pct / 100);

  function choose(value) {
    setLocalPct(value);
    onReinvestChange?.(value);
  }

  return (
    <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      <Cell
        label={t("dashboard.revenue")}
        value={revenue}
        loading={loading}
        meta={
          summary
            ? `${summary.salesCount ?? 0} ${t("dashboard.salesCount")} · ${t("dashboard.avgSale")} ${compactMoney(summary.avgSale ?? 0)}`
            : null
        }
      />
      <Cell
        label={t("dashboard.expenses")}
        value={expenses}
        loading={loading}
        tone="info"
      />
      <Cell
        label={t("dashboard.netProfit")}
        value={net}
        loading={loading}
        tone={net < 0 ? "danger" : "jade"}
        emphasis
      />

      <div className="bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xs text-muted">{t("dashboard.reinvest")}</span>
          <span className="text-[10px] text-faint">{t("dashboard.reinvestHint")}</span>
        </div>

        {loading ? (
          <Skeleton className="mt-2 h-7 w-28" />
        ) : (
          <Money value={reinvest} className="mt-1.5 block text-xl text-brass" />
        )}

        <div className="mt-2.5 flex gap-1">
          {REINVEST_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className={cn(
                "tnum h-6 flex-1 rounded-sm border text-[11px] transition-colors",
                option === pct
                  ? "border-brass bg-brass-dim text-brass"
                  : "border-line text-faint hover:border-line-strong hover:text-muted"
              )}
            >
              {option}%
            </button>
          ))}
        </div>

        {net <= 0 && !loading && (
          <p className="mt-2 text-[10px] leading-snug text-faint">{t("dashboard.lossNote")}</p>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, meta, tone, emphasis, loading }) {
  const toneClass =
    tone === "jade"
      ? "text-jade"
      : tone === "danger"
        ? "text-danger"
        : tone === "info"
          ? "text-info"
          : "text-fg";

  return (
    <div className="bg-surface p-4">
      <span className="text-2xs text-muted">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-32" />
      ) : (
        <Money
          value={value}
          className={cn("mt-1.5 block", emphasis ? "text-2xl" : "text-xl", toneClass)}
        />
      )}
      {meta && !loading && <p className="mt-1.5 text-[10px] text-faint">{meta}</p>}
    </div>
  );
}
