"use client";

import Link from "next/link";
import { AlertTriangle, PackageX } from "lucide-react";
import { stockLevel } from "@/lib/types";
import { cn, money } from "@/lib/utils";

/**
 * Deliberately not styled like the other panels: a warning border and a
 * ticker-style header so it reads as an alert, not another statistic.
 * Sorted so the genuinely out-of-stock items sit at the top.
 */
export function LowStockAlerts({ products }) {
  const flagged = products
    .filter((p) => stockLevel(p) !== "ok")
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));

  const outCount = flagged.filter((p) => stockLevel(p) === "out").length;
  const restockCost = flagged.reduce(
    (sum, p) => sum + Math.max(p.minStockThreshold - p.quantity, 0) * p.costPrice,
    0
  );

  return (
    <section className="flex flex-col overflow-hidden rounded border border-brass/40 bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-brass/30 bg-brass-dim/50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-brass" strokeWidth={2} />
          <h2 className="text-sm font-medium text-fg">Stock alerts</h2>
        </div>
        <span className="font-mono text-2xs text-brass tnum">
          {flagged.length} item{flagged.length === 1 ? "" : "s"}
          {outCount > 0 && <span className="text-danger"> · {outCount} out</span>}
        </span>
      </header>

      <ul className="max-h-[292px] flex-1 divide-y divide-line overflow-y-auto">
        {flagged.map((p) => {
          const out = stockLevel(p) === "out";
          return (
            <li
              key={p.id}
              className={cn(
                "group flex items-center gap-3 border-l-2 px-5 py-3 transition-colors hover:bg-elevated",
                out ? "border-l-danger" : "border-l-brass"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-fg">{p.name}</p>
                <p className="mt-0.5 font-mono text-2xs text-faint">
                  {p.sku} · min {p.minStockThreshold} · {p.supplier}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {out ? (
                  <span className="flex items-center gap-1 font-mono text-[13px] font-semibold text-danger">
                    <PackageX className="h-3.5 w-3.5" strokeWidth={2} />
                    out
                  </span>
                ) : (
                  <span className="font-mono text-[13px] font-semibold text-brass tnum">
                    {p.quantity} left
                  </span>
                )}
              </div>
            </li>
          );
        })}

        {flagged.length === 0 && (
          <li className="px-5 py-12 text-center text-[13px] text-muted">
            Every item is above its threshold.
          </li>
        )}
      </ul>

      <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="text-2xs text-faint">
          Restock to minimum:{" "}
          <span className="font-mono text-muted tnum">
            {money(restockCost, { decimals: false })}
          </span>
        </span>
        <Link
          href="/inventory?filter=low"
          className="text-2xs text-brass transition-colors hover:text-brass-hi"
        >
          Create purchase order
        </Link>
      </footer>
    </section>
  );
}
