"use client";

import { useMemo, useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { TimeFilter } from "@/components/dashboard/TimeFilter";
import { EXPENSES, periodTotals } from "@/lib/mock-data";
import { EXPENSE_GROUP_META } from "@/lib/types";
import { cn, money } from "@/lib/utils";

const GROUP_ORDER = ["fixed", "stock", "oneoff"];

const GROUP_ACCENT = {
  fixed: "bg-info",
  stock: "bg-brass",
  oneoff: "bg-danger",
};

export default function ExpensesPage() {
  const [range, setRange] = useState("month");

  const byGroup = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach((g) => {
      map[g] = EXPENSES.filter((e) => e.group === g);
    });
    return map;
  }, []);

  const groupTotals = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach((g) => {
      map[g] = byGroup[g].reduce((s, e) => s + e.amount, 0);
    });
    return map;
  }, [byGroup]);

  const totalExpenses = GROUP_ORDER.reduce((s, g) => s + groupTotals[g], 0);
  const revenue = periodTotals(range).revenue;
  const netProfit = revenue - totalExpenses;

  return (
    <>
      <PageHeader title="Expenses" subtitle="Everything that reduces net profit">
        <TimeFilter value={range} onChange={setRange} />
        <Button size="sm">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Log expense
        </Button>
      </PageHeader>

      <main className="flex-1 space-y-4 p-5 sm:p-6">
        {/* The profit equation, shown rather than explained. This is the one
            place a store owner can see exactly where the money went. */}
        <Panel>
          <PanelHeader
            title="How net profit is calculated"
            meta="Revenue minus every expense category below"
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-4">
            <Term label="Revenue" value={money(revenue, { decimals: false })} tone="text-fg" big />
            <Operator>−</Operator>
            <Term
              label="Fixed"
              value={money(groupTotals.fixed, { decimals: false })}
              tone="text-info"
            />
            <Operator>−</Operator>
            <Term
              label="Stock"
              value={money(groupTotals.stock, { decimals: false })}
              tone="text-brass"
            />
            <Operator>−</Operator>
            <Term
              label="One-time"
              value={money(groupTotals.oneoff, { decimals: false })}
              tone="text-danger"
            />
            <Operator>=</Operator>
            <Term
              label="Net profit"
              value={money(netProfit, { decimals: false })}
              tone={netProfit >= 0 ? "text-jade" : "text-danger"}
              big
            />
          </div>

          {/* Proportional bar — where each lari of revenue ends up */}
          <div className="mt-6">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg">
              {GROUP_ORDER.map((g) => (
                <div
                  key={g}
                  className={cn("h-full", GROUP_ACCENT[g])}
                  style={{ width: `${(groupTotals[g] / revenue) * 100}%` }}
                  title={`${EXPENSE_GROUP_META[g].label}: ${money(groupTotals[g])}`}
                />
              ))}
              <div className="h-full flex-1 bg-jade" />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
              {GROUP_ORDER.map((g) => (
                <LegendDot
                  key={g}
                  className={GROUP_ACCENT[g]}
                  label={EXPENSE_GROUP_META[g].label}
                  pct={(groupTotals[g] / revenue) * 100}
                />
              ))}
              <LegendDot
                className="bg-jade"
                label="Retained profit"
                pct={(netProfit / revenue) * 100}
              />
            </div>
          </div>
        </Panel>

        {/* Three category sections */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {GROUP_ORDER.map((group) => (
            <Panel key={group} flush className="flex flex-col">
              <div className="border-b border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", GROUP_ACCENT[group])} />
                      <h2 className="text-sm font-medium text-fg">
                        {EXPENSE_GROUP_META[group].label}
                      </h2>
                    </div>
                    <p className="mt-1 max-w-[24ch] text-2xs leading-relaxed text-faint">
                      {EXPENSE_GROUP_META[group].hint}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-lg font-semibold text-fg tnum">
                    {money(groupTotals[group], { decimals: false })}
                  </span>
                </div>
              </div>

              <ul className="flex-1 divide-y divide-line">
                {byGroup[group].map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-elevated/50">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13px] text-fg">
                        <span className="truncate">{e.label}</span>
                        {e.recurring && (
                          <Repeat className="h-3 w-3 shrink-0 text-faint" strokeWidth={1.8} />
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-2xs text-faint">
                        {new Date(e.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                        {e.vendor && ` · ${e.vendor}`}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[13px] text-muted tnum">
                      {money(e.amount, { decimals: false })}
                    </span>
                  </li>
                ))}
                {byGroup[group].length === 0 && (
                  <li className="px-5 py-10 text-center text-2xs text-faint">
                    Nothing logged this period.
                  </li>
                )}
              </ul>

              <div className="border-t border-line p-3">
                <Button variant="ghost" size="sm" className="w-full">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Add {EXPENSE_GROUP_META[group].label.toLowerCase()} expense
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      </main>
    </>
  );
}

function Term({ label, value, tone, big }) {
  return (
    <div>
      <span className="block text-2xs text-faint">{label}</span>
      <span
        className={cn(
          "block font-mono font-semibold tracking-tight tnum",
          big ? "text-2xl" : "text-lg",
          tone
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Operator({ children }) {
  return <span className="self-end pb-1 font-mono text-lg text-faint">{children}</span>;
}

function LegendDot({ className, label, pct }) {
  return (
    <span className="flex items-center gap-1.5 text-2xs text-muted">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
      <span className="font-mono text-faint tnum">{pct.toFixed(1)}%</span>
    </span>
  );
}
