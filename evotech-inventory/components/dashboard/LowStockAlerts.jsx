"use client";

import Link from "next/link";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { cn, money } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";

/**
 * Deliberately not shaped like the other panels — brass edge, brass header.
 * This is the one widget that asks the owner to go and do something today,
 * and it should be findable from across the room.
 */
export function LowStockAlerts({ query }) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col overflow-hidden rounded border border-brass/55 bg-surface">
      <header className="flex items-center gap-2 border-b border-brass/40 bg-brass-dim/60 px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-brass" strokeWidth={2} />
        <h2 className="text-[13px] font-medium text-brass">{t("dashboard.lowStock")}</h2>
        <span className="ml-auto text-[10px] text-brass/70">{t("dashboard.lowStockHint")}</span>
      </header>

      <Async
        query={query}
        isEmpty={(data) => !data?.length}
        skeleton={<SkeletonRows rows={3} className="p-4" />}
        empty={<EmptyState title={t("dashboard.noLowStock")} icon={PackageCheck} compact />}
      >
        {(items) => <List items={items} />}
      </Async>
    </section>
  );
}

function List({ items }) {
  const { t } = useI18n();

  // Zero first: a product nobody can sell outranks one with two left.
  const sorted = [...items].sort((a, b) => a.quantity - b.quantity);
  const restockCost = sorted.reduce(
    (sum, item) => sum + Math.max(0, item.minStockThreshold - item.quantity) * (item.costPrice ?? 0),
    0
  );

  return (
    <>
      <ul className="divide-y divide-line">
        {sorted.map((item) => {
          const out = item.quantity <= 0;
          return (
            <li key={item.id}>
              <Link
                href={`/inventory?focus=${item.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-elevated"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-fg">{item.name}</span>
                  <span className="block truncate text-[10px] text-faint">
                    {[item.brand, item.devices?.[0]?.name].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span
                  className={cn(
                    "tnum shrink-0 rounded-sm px-2 py-1 font-mono text-[11px]",
                    out ? "bg-danger-dim text-danger" : "bg-elevated text-brass"
                  )}
                >
                  {out ? t("dashboard.outOfStock") : `${item.quantity} ${t("dashboard.leftCount")}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {restockCost > 0 && (
        <footer className="flex items-baseline justify-between border-t border-line px-4 py-2.5">
          <span className="text-[10px] text-faint">{t("dashboard.restockCost")}</span>
          <span className="tnum font-mono text-[13px] text-fg">{money(restockCost)}</span>
        </footer>
      )}
    </>
  );
}
