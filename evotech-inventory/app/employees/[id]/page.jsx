"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { DateFilter } from "@/components/filters/DateFilter";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ErrorState, Skeleton } from "@/components/ui/state";
import { AttendanceTable } from "@/components/employees/AttendanceTable";
import { ScheduleEditor } from "@/components/employees/ScheduleEditor";
import { useApi } from "@/lib/hooks";
import {
  attendance as attendanceApi,
  employees as employeesApi,
  reports,
  settings as settingsApi,
} from "@/lib/api";
import { RANGE_KINDS, resolveRange } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { cn, money } from "@/lib/utils";

export default function EmployeePage() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const params = useParams();
  const id = params.id;

  const [spec, setSpec] = useState({ kind: RANGE_KINDS.MONTH });
  const range = useMemo(() => resolveRange(spec), [spec]);
  const key = `${range.from}|${range.to}`;

  const person = useApi(() => employeesApi.get(id), [id]);
  const sales = useApi(() => reports.employeeSales(range), [key]);
  const records = useApi(() => attendanceApi.list(range, { employeeId: id }), [key, id]);
  const config = useApi(() => settingsApi.get(), []);

  const mine = (sales.data ?? []).find((row) => String(row.employeeId) === String(id));

  if (person.error) {
    return (
      <>
        <PageHeader title={t("employees.title")} />
        <main className="p-5">
          <ErrorState error={person.error} onRetry={person.reload} />
        </main>
      </>
    );
  }

  const data = person.data;
  const commission =
    data?.salaryModel === "commission"
      ? ((mine?.revenue ?? 0) * (data.commissionRate ?? 0)) / 100
      : null;

  return (
    <>
      <PageHeader
        title={data?.fullName ?? "…"}
        subtitle={
          data?.schedule ? `${data.schedule.startTime}–${data.schedule.endTime}` : undefined
        }
        actions={<DateFilter value={spec} onChange={setSpec} />}
      />

      <main className="grid gap-4 p-5 xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="space-y-4">
          <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-3">
            <Metric
              label={t("employees.sold")}
              value={money(mine?.revenue ?? 0)}
              loading={sales.loading}
              emphasis
            />
            <Metric
              label={t("employees.salesCount")}
              value={String(mine?.salesCount ?? 0)}
              loading={sales.loading}
            />
            <Metric
              label={
                commission != null ? t("employees.commissionEarned") : t("employees.monthlySalary")
              }
              value={money(commission ?? data?.monthlySalary ?? 0)}
              loading={person.loading}
              tone="text-brass"
            />
          </div>

          <div className="overflow-hidden rounded border border-line bg-surface">
            <PanelHeader
              title={t("attendance.title")}
              className="border-b border-line px-5 py-3.5"
            />
            <AttendanceTable
              query={records}
              graceMinutes={config.data?.lateGraceMinutes ?? 0}
              showEmployee={false}
            />
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[72px]">
          {data && isAdmin && <ScheduleEditor employee={data} onSaved={person.reload} />}

          {data && !isAdmin && (
            <Panel>
              <PanelHeader title={t("employees.schedule")} />
              <p className="tnum mt-3 font-mono text-xl text-fg">
                {data.schedule
                  ? `${data.schedule.startTime} – ${data.schedule.endTime}`
                  : "—"}
              </p>
            </Panel>
          )}

          {data && (
            <Panel>
              <PanelHeader title={t("employees.roles")} />
              <ul className="mt-3 space-y-1.5">
                {(data.roles ?? []).map((role) => (
                  <li key={role} className="text-[13px] text-muted">
                    {t(`employees.${role === "stock_manager" ? "stockManager" : role}`)}
                  </li>
                ))}
              </ul>
              {data.phone && (
                <p className="mt-4 border-t border-line pt-3 font-mono text-[13px] text-muted">
                  {data.phone}
                </p>
              )}
            </Panel>
          )}
        </div>
      </main>
    </>
  );
}

function Metric({ label, value, loading, tone, emphasis }) {
  return (
    <div className="bg-surface p-4">
      <span className="text-2xs text-muted">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p
          className={cn(
            "tnum mt-1.5 font-mono",
            emphasis ? "text-2xl" : "text-xl",
            tone ?? "text-fg"
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
