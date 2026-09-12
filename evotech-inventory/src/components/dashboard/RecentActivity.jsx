"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  LogIn,
  PackagePlus,
  Receipt,
  Wrench,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn, money, timeAgo } from "@/lib/utils";

const KIND_META = {
  sale: { icon: ArrowUpRight, tone: "text-jade", sign: "+" },
  repair: { icon: Wrench, tone: "text-jade", sign: "+" },
  refund: { icon: ArrowDownLeft, tone: "text-danger", sign: "−" },
  expense: { icon: Receipt, tone: "text-danger", sign: "−" },
  stock_in: { icon: PackagePlus, tone: "text-info", sign: "" },
  login: { icon: LogIn, tone: "text-faint", sign: "" },
};

export function RecentActivity({ items }) {
  return (
    <Panel flush>
      <div className="border-b border-line p-5">
        <PanelHeader
          title="Recent activity"
          meta="Transactions and system log"
          action={
            <span className="flex items-center gap-1.5 text-2xs text-faint">
              <span className="h-1.5 w-1.5 animate-pulse-line rounded-full bg-jade" />
              live
            </span>
          }
        />
      </div>

      <ul className="divide-y divide-line">
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          return (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-elevated/50">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-bg",
                  meta.tone
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-fg">{item.message}</p>
                <p className="mt-0.5 text-2xs text-faint">
                  {item.actor} · {timeAgo(item.at, new Date("2026-09-13T18:00:00"))}
                </p>
              </div>

              {item.amount !== undefined && (
                <span className={cn("shrink-0 font-mono text-[13px] tnum", meta.tone)}>
                  {meta.sign}
                  {money(item.amount, { decimals: false })}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
