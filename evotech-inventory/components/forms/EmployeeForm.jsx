"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Switch, ToggleGroup } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useAction } from "@/lib/hooks";
import { employees as employeesApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "admin", label: "employees.admin", hint: "employees.adminHint" },
  { id: "cashier", label: "employees.cashier", hint: "employees.cashierHint" },
  { id: "technician", label: "employees.technician", hint: "employees.technicianHint" },
  { id: "stock_manager", label: "employees.stockManager", hint: "employees.stockManagerHint" },
];

const EMPTY = {
  fullName: "",
  phone: "",
  pin: ["", "", "", ""],
  active: true,
  roles: ["cashier"],
  startTime: "11:00",
  endTime: "19:00",
  salaryModel: "fixed",
  monthlySalary: "",
  commissionRate: "",
};

export function EmployeeForm({ employee, onSaved }) {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(() =>
    employee
      ? {
          ...EMPTY,
          ...employee,
          pin: ["", "", "", ""],
          startTime: employee.schedule?.startTime ?? "11:00",
          endTime: employee.schedule?.endTime ?? "19:00",
          monthlySalary: employee.monthlySalary ?? "",
          commissionRate: employee.commissionRate ?? "",
        }
      : EMPTY
  );

  const save = useAction((data) =>
    employee ? employeesApi.update(employee.id, data) : employeesApi.create(data)
  );

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(role) {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((entry) => entry !== role)
        : [...current.roles, role],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    const pin = form.pin.join("");
    const saved = await save.run({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      // Only sent when actually set, so editing someone does not wipe their PIN.
      ...(pin.length === 4 ? { pin } : {}),
      active: form.active,
      roles: form.roles,
      schedule: { startTime: form.startTime, endTime: form.endTime },
      salaryModel: form.salaryModel,
      monthlySalary: form.salaryModel === "fixed" ? Number(form.monthlySalary) || 0 : null,
      commissionRate: form.salaryModel === "commission" ? Number(form.commissionRate) || 0 : null,
    });
    if (onSaved) onSaved(saved);
    else router.push("/employees");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-start">
      <div className="space-y-4">
        <Panel flush>
          <PanelHeader
            title={t("employees.newEmployee")}
            className="border-b border-line px-5 py-3.5"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("employees.fullName")} required className="sm:col-span-2">
              <Input
                value={form.fullName}
                onChange={(event) => set("fullName", event.target.value)}
                required
              />
            </Field>

            <Field label={t("employees.phone")}>
              <Input
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                inputMode="tel"
                className="font-mono"
                placeholder="+995 5xx xx xx xx"
              />
            </Field>

            <Field label={t("employees.pin")} hint={t("employees.pinHint")} required={!employee}>
              <PinBoxes value={form.pin} onChange={(pin) => set("pin", pin)} />
            </Field>
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader
            title={t("employees.schedule")}
            meta={t("employees.scheduleHint")}
            className="border-b border-line px-5 py-3.5"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("employees.startsAt")}>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => set("startTime", event.target.value)}
                className="tnum font-mono"
              />
            </Field>
            <Field label={t("employees.endsAt")}>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => set("endTime", event.target.value)}
                className="tnum font-mono"
              />
            </Field>
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader title={t("employees.roles")} className="border-b border-line px-5 py-3.5" />
          <div className="grid gap-2 p-5 sm:grid-cols-2">
            {ROLES.map((role) => (
              <Checkbox
                key={role.id}
                checked={form.roles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
                label={t(role.label)}
                description={t(role.hint)}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4 xl:sticky xl:top-[72px]">
        <Panel>
          <Switch
            checked={form.active}
            onChange={(value) => set("active", value)}
            label={form.active ? t("employees.active") : t("employees.inactive")}
            description={t("employees.activeHint")}
          />
        </Panel>

        <Panel>
          <PanelHeader title={t("employees.salaryModel")} />
          <ToggleGroup
            className="mt-3 w-full"
            value={form.salaryModel}
            onChange={(value) => set("salaryModel", value)}
            options={[
              { value: "fixed", label: t("employees.salaryFixed") },
              { value: "commission", label: t("employees.salaryCommission") },
            ]}
          />

          <div className="mt-4">
            {form.salaryModel === "fixed" ? (
              <Field label={t("employees.monthlySalary")}>
                <Input
                  value={form.monthlySalary}
                  onChange={(event) => set("monthlySalary", event.target.value)}
                  inputMode="decimal"
                  className="tnum text-right font-mono"
                />
              </Field>
            ) : (
              <Field label={t("employees.commissionRate")}>
                <div className="relative">
                  <Input
                    value={form.commissionRate}
                    onChange={(event) => set("commissionRate", event.target.value)}
                    inputMode="decimal"
                    className="tnum pr-8 text-right font-mono"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-faint">
                    %
                  </span>
                </div>
              </Field>
            )}
          </div>
        </Panel>

        {save.error && (
          <p className="rounded border border-danger/40 bg-danger-dim px-3 py-2 text-2xs text-danger">
            {save.error.message === "NETWORK" ? t("state.offline") : save.error.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={save.pending}>
            {save.pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {save.pending ? t("state.saving") : t("state.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("state.cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Four boxes rather than one field, because that is what the cashier will
 * see on the till — the shape of the thing should match everywhere it appears.
 */
function PinBoxes({ value, onChange }) {
  const refs = useRef([]);

  function setDigit(index, digit) {
    if (digit && !/^[0-9]$/.test(digit)) return;
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < 3) refs.current[index + 1]?.focus();
  }

  return (
    <div className="flex gap-2">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          inputMode="numeric"
          maxLength={1}
          onChange={(event) => setDigit(index, event.target.value.slice(-1))}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          className={cn(
            "tnum h-10 w-10 rounded border border-line bg-bg text-center font-mono text-base text-fg",
            "transition-colors hover:border-line-strong focus:border-brass focus:outline-none"
          )}
        />
      ))}
    </div>
  );
}
