"use client";

import {
  ArrowDownLeft,
  LogIn,
  LogOut,
  PackagePlus,
  Receipt,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useI18n, useTimeAgo } from "@/lib/i18n";
import { cn, money } from "@/lib/utils";

const KINDS = {
  sale: { icon: ScanLine, tone: "text-jade" },
  refund: { icon: RotateCcw, tone: "text-danger" },
  product_added: { icon: PackagePlus, tone: "text-brass" },
  stock_in: { icon: ArrowDownLeft, tone: "text-info" },
  expense: { icon: Receipt, tone: "text-info" },
  clock_in: { icon: LogIn, tone: "text-muted" },
  clock_out: { icon: LogOut, tone: "text-muted" },
};

const LABELS = {
  sale: "activity.sale",
  refund: "activity.refund",
  product_added: "activity.productAdded",
  stock_in: "activity.stockIn",
  expense: "activity.expense",
  clock_in: "activity.clockIn",
  clock_out: "activity.clockOut",
};

export function RecentActivity({ query }) {
  const { t } = useI18n();

  return (
    <Panel flush className="flex flex-col">
      <PanelHeader
        title={t("dashboard.recentActivity")}
        className="border-b border-line px-5 py-3.5"
      />
      <Async
        query={query}
        isEmpty={(data) => !data?.length}
        skeleton={<SkeletonRows rows={5} className="p-4" />}
        empty={<EmptyState title={t("state.empty")} compact />}
      >
        {(items) => <Feed items={items} />}
      </Async>
    </Panel>
  );
}

function Feed({ items }) {
  const { t } = useI18n();
  const timeAgo = useTimeAgo();

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const kind = KINDS[item.kind] ?? KINDS.sale;
        const Icon = kind.icon;
        const outgoing = item.kind === "expense" || item.kind === "refund";

        return (
          <li key={item.id} className="flex items-center gap-3 px-5 py-2.5">
            <Icon className={cn("h-3.5 w-3.5 shrink-0", kind.tone)} strokeWidth={1.8} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-fg">
                {item.description || t(LABELS[item.kind] ?? "activity.sale")}
              </span>
              <span className="block truncate text-[10px] text-faint">
                {[item.actorName, timeAgo(item.at)].filter(Boolean).join(" · ")}
              </span>
            </span>
            {item.amount != null && (
              <span
                className={cn(
                  "tnum shrink-0 font-mono text-[13px]",
                  outgoing ? "text-muted" : "text-fg"
                )}
              >
                {outgoing ? "−" : "+"}
                {money(Math.abs(item.amount), { decimals: false })}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
