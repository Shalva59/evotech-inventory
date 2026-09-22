"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { DateFilter } from "@/components/filters/DateFilter";
import { AttendanceTable } from "@/components/employees/AttendanceTable";
import { useApi } from "@/lib/hooks";
import { attendance as attendanceApi, settings as settingsApi } from "@/lib/api";
import { RANGE_KINDS, resolveRange } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";

export default function AttendancePage() {
  const { t } = useI18n();
  const [spec, setSpec] = useState({ kind: RANGE_KINDS.TODAY });

  const range = useMemo(() => resolveRange(spec), [spec]);
  const key = `${range.from}|${range.to}`;

  const records = useApi(() => attendanceApi.list(range), [key]);
  const config = useApi(() => settingsApi.get(), []);

  return (
    <>
      <PageHeader
        title={t("attendance.title")}
        actions={<DateFilter value={spec} onChange={setSpec} />}
      />

      <main className="p-5">
        <div className="overflow-hidden rounded border border-line bg-surface">
          <AttendanceTable query={records} graceMinutes={config.data?.lateGraceMinutes ?? 0} />
        </div>
      </main>
    </>
  );
}
