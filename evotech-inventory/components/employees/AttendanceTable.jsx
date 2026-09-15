"use client";

import { CalendarClock } from "lucide-react";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useI18n } from "@/lib/i18n";
import { clockTime, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Scheduled against actual, side by side. The lateness column is the only
 * place on this screen that is allowed to turn red, and it only does so past
 * the grace period the owner set — a minute of red every morning trains
 * everyone to ignore red.
 */
export function AttendanceTable({ query, graceMinutes = 0, showEmployee = true }) {
  const { t, lang } = useI18n();

  return (
    <Async
      query={query}
      isEmpty={(data) => !data?.length}
      skeleton={<SkeletonRows rows={5} className="p-4" />}
      empty={
        <EmptyState
          icon={CalendarClock}
          title={t("attendance.empty")}
          hint={t("attendance.emptyHint")}
        />
      }
    >
      {(rows) => (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-faint">
              <th className="px-4 py-2.5 font-normal">
                {showEmployee ? t("attendance.employee") : t("expenses.date")}
              </th>
              {showEmployee && (
                <th className="hidden px-4 py-2.5 font-normal sm:table-cell">
                  {t("expenses.date")}
                </th>
              )}
              <th className="px-4 py-2.5 text-right font-normal">{t("attendance.scheduled")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("attendance.arrived")}</th>
              <th className="hidden px-4 py-2.5 text-right font-normal sm:table-cell">
                {t("attendance.left")}
              </th>
              <th className="hidden px-4 py-2.5 text-right font-normal md:table-cell">
                {t("attendance.hours")}
              </th>
              <th className="px-4 py-2.5 text-right font-normal">{t("attendance.lateness")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const late = row.lateMinutes ?? 0;
              const excused = late <= graceMinutes;
              const dateLabel = new Date(row.date).toLocaleDateString(
                lang === "ka" ? "ka-GE" : "en-GB",
                { day: "numeric", month: "short" }
              );

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-[13px] text-fg">
                    {showEmployee ? row.fullName : dateLabel}
                  </td>
                  {showEmployee && (
                    <td className="hidden px-4 py-3 text-[13px] text-muted sm:table-cell">
                      {dateLabel}
                    </td>
                  )}
                  <td className="tnum px-4 py-3 text-right font-mono text-[13px] text-muted">
                    {row.scheduledStart ?? "—"}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-mono text-[13px] text-fg">
                    {clockTime(row.clockIn)}
                  </td>
                  <td className="tnum hidden px-4 py-3 text-right font-mono text-[13px] text-muted sm:table-cell">
                    {row.clockOut ? (
                      clockTime(row.clockOut)
                    ) : row.clockIn ? (
                      <span className="font-sans text-[11px] text-jade">
                        {t("attendance.stillIn")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="tnum hidden px-4 py-3 text-right font-mono text-[13px] text-muted md:table-cell">
                    {formatDuration(row.minutesWorked)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!row.clockIn ? (
                      <span className="text-[11px] text-faint">{t("attendance.absent")}</span>
                    ) : (
                      <span
                        className={cn(
                          "tnum rounded-sm px-2 py-1 font-mono text-[11px]",
                          excused
                            ? late < 0
                              ? "text-muted"
                              : "text-jade"
                            : "bg-danger-dim text-danger"
                        )}
                      >
                        {late > 0 ? `+${formatDuration(late)}` : t("attendance.onTime")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Async>
  );
}
