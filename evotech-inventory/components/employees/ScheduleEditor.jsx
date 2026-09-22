"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useAction } from "@/lib/hooks";
import { employees as employeesApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * The owner sets the hours; nobody else can. Changing them here is what the
 * lateness column is measured against from the next sign-in onwards — past
 * records keep the schedule they were judged by.
 */
export function ScheduleEditor({ employee, onSaved }) {
  const { t } = useI18n();
  const [startTime, setStartTime] = useState(employee.schedule?.startTime ?? "11:00");
  const [endTime, setEndTime] = useState(employee.schedule?.endTime ?? "19:00");
  const [done, setDone] = useState(false);

  const save = useAction((data) => employeesApi.setSchedule(employee.id, data));

  async function submit(event) {
    event.preventDefault();
    await save.run({ startTime, endTime });
    setDone(true);
    setTimeout(() => setDone(false), 2200);
    onSaved?.();
  }

  return (
    <Panel>
      <PanelHeader title={t("employees.schedule")} meta={t("employees.scheduleHint")} />
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("employees.startsAt")}>
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="tnum font-mono"
            />
          </Field>
          <Field label={t("employees.endsAt")}>
            <Input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="tnum font-mono"
            />
          </Field>
        </div>

        <Button type="submit" className="w-full" disabled={save.pending}>
          {save.pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {done && <Check className="h-4 w-4" strokeWidth={2.5} />}
          {done ? t("employees.scheduleSaved") : t("state.save")}
        </Button>

        {save.error && (
          <p className="text-2xs text-danger">
            {save.error.message === "NETWORK" ? t("state.offline") : save.error.message}
          </p>
        )}
      </form>
    </Panel>
  );
}
