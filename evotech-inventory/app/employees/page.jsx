"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { DateFilter } from "@/components/filters/DateFilter";
import { Button } from "@/components/ui/button";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { employees as employeesApi, reports } from "@/lib/api";
import { RANGE_KINDS, resolveRange } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { initials } from "@/lib/auth";
import { cn, money } from "@/lib/utils";

/**
 * The staff list answers two questions at once: who works when, and who is
 * actually selling. The period control at the top switches the sales column
 * between a single day and a whole month without leaving the page.
 */
export default function EmployeesPage() {
  const { t } = useI18n();
  const [spec, setSpec] = useState({ kind: RANGE_KINDS.MONTH });

  const range = useMemo(() => resolveRange(spec), [spec]);
  const key = `${range.from}|${range.to}`;

  const list = useApi(() => employeesApi.list(), []);
  const sales = useApi(() => reports.employeeSales(range), [key]);

  const salesById = useMemo(() => {
    const map = new Map();
    for (const row of sales.data ?? []) map.set(String(row.employeeId), row);
    return map;
  }, [sales.data]);

  return (
    <>
      <PageHeader
        title={t("employees.title")}
        actions={
          <>
            <DateFilter value={spec} onChange={setSpec} />
            <Button asChild size="sm">
              <Link href="/employees/new">
                <Plus className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{t("employees.add")}</span>
              </Link>
            </Button>
          </>
        }
      />

      <main className="p-5">
        <div className="overflow-hidden rounded border border-line bg-surface">
          <Async
            query={list}
            isEmpty={(data) => !data?.length}
            skeleton={<SkeletonRows rows={4} className="p-4" />}
            empty={
              <EmptyState
                icon={Users}
                title={t("employees.empty")}
                hint={t("employees.emptyHint")}
                action={
                  <Button asChild size="sm">
                    <Link href="/employees/new">{t("employees.add")}</Link>
                  </Button>
                }
              />
            }
          >
            {(items) => (
              <ul className="divide-y divide-line">
                {items.map((person) => (
                  <Row
                    key={person.id}
                    person={person}
                    sales={salesById.get(String(person.id))}
                    loading={sales.loading}
                  />
                ))}
              </ul>
            )}
          </Async>
        </div>
      </main>
    </>
  );
}

function Row({ person, sales, loading }) {
  const { t } = useI18n();
  const schedule = person.schedule;

  return (
    <li>
      <Link
        href={`/employees/${person.id}`}
        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-elevated/50"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xs font-semibold",
            person.active ? "bg-brass-dim text-brass" : "bg-elevated text-faint"
          )}
        >
          {initials(person.fullName)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] text-fg">{person.fullName}</span>
            {!person.active && (
              <span className="shrink-0 rounded-sm bg-elevated px-1.5 py-0.5 text-[10px] text-faint">
                {t("employees.inactive")}
              </span>
            )}
          </span>
          <span className="block truncate text-[10px] text-faint">
            {(person.roles ?? []).map((role) => t(`employees.${roleKey(role)}`)).join(" · ")}
          </span>
        </span>

        {/* Working hours — the thing the owner scans this list for. */}
        <span className="hidden shrink-0 text-right sm:block">
          <span className="tnum block font-mono text-[13px] text-fg">
            {schedule ? `${schedule.startTime}–${schedule.endTime}` : "—"}
          </span>
          <span className="block text-[10px] text-faint">{t("employees.schedule")}</span>
        </span>

        <span className="w-[104px] shrink-0 text-right">
          <span className="tnum block font-mono text-[13px] text-fg">
            {loading ? "…" : money(sales?.revenue ?? 0, { decimals: false })}
          </span>
          <span className="block text-[10px] text-faint">
            {sales?.salesCount
              ? `${sales.salesCount} ${t("employees.salesCount")}`
              : t("employees.sold")}
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.8} />
      </Link>
    </li>
  );
}

function roleKey(role) {
  return role === "stock_manager" ? "stockManager" : role;
}
