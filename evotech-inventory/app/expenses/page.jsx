"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { DateFilter } from "@/components/filters/DateFilter";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi, useAction } from "@/lib/hooks";
import { expenses as expensesApi, reports } from "@/lib/api";
import { RANGE_KINDS, resolveRange, toDateKey } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
import { cn, money } from "@/lib/utils";

const TYPES = [
  { id: "fixed", labelKey: "expenses.fixed", color: "bg-info" },
  { id: "stock", labelKey: "expenses.stock", color: "bg-brass" },
  { id: "oneoff", labelKey: "expenses.oneOff", color: "bg-muted" },
];

export default function ExpensesPage() {
  const { t, lang } = useI18n();
  const [spec, setSpec] = useState({ kind: RANGE_KINDS.MONTH });
  const [adding, setAdding] = useState(false);

  const range = useMemo(() => resolveRange(spec), [spec]);
  const key = `${range.from}|${range.to}`;

  const list = useApi(() => expensesApi.list(range), [key]);
  const summary = useApi(() => reports.summary(range), [key]);

  const revenue = summary.data?.revenue ?? 0;
  const byType = summary.data?.expenses ?? { fixed: 0, stock: 0, oneoff: 0, total: 0 };
  const net = summary.data?.netProfit ?? revenue - (byType.total ?? 0);

  async function remove(id) {
    await expensesApi.remove(id);
    list.reload();
    summary.reload();
  }

  return (
    <>
      <PageHeader
        title={t("expenses.title")}
        actions={
          <>
            <DateFilter value={spec} onChange={setSpec} />
            <Button size="sm" onClick={() => setAdding((v) => !v)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">{t("expenses.add")}</span>
            </Button>
          </>
        }
      />

      <main className="space-y-4 p-5">
        {adding && (
          <ExpenseForm
            onDone={() => {
              setAdding(false);
              list.reload();
              summary.reload();
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* The whole point of this screen, stated as one sentence. */}
        <Panel>
          <PanelHeader title={t("expenses.equation")} />
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2 font-mono">
            <span className="tnum text-xl text-fg">{money(revenue)}</span>
            <span className="text-muted">−</span>
            <span className="tnum text-xl text-info">{money(byType.total ?? 0)}</span>
            <span className="text-muted">=</span>
            <span className={cn("tnum text-2xl", net < 0 ? "text-danger" : "text-jade")}>
              {money(net)}
            </span>
          </div>

          <ProportionBar revenue={revenue} byType={byType} net={net} />
        </Panel>

        <div className="overflow-hidden rounded border border-line bg-surface">
          <PanelHeader title={t("expenses.title")} className="border-b border-line px-5 py-3.5" />
          <Async
            query={list}
            isEmpty={(data) => !data?.length}
            skeleton={<SkeletonRows rows={5} className="p-4" />}
            empty={
              <EmptyState
                icon={Receipt}
                title={t("expenses.empty")}
                hint={t("expenses.emptyHint")}
              />
            }
          >
            {(items) => (
              <ul className="divide-y divide-line">
                {items.map((item) => {
                  const type = TYPES.find((entry) => entry.id === item.type) ?? TYPES[2];
                  return (
                    <li key={item.id} className="group flex items-center gap-3 px-5 py-3">
                      <span className={cn("h-6 w-[3px] shrink-0 rounded-full", type.color)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-fg">
                          {item.description}
                        </span>
                        <span className="block truncate text-[10px] text-faint">
                          {[
                            t(type.labelKey),
                            item.paidTo,
                            new Date(item.date).toLocaleDateString(
                              lang === "ka" ? "ka-GE" : "en-GB"
                            ),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="tnum shrink-0 font-mono text-[13px] text-fg">
                        {money(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                        aria-label={t("state.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Async>
        </div>
      </main>
    </>
  );
}

/** Where each lari of revenue went — proportional, so it reads at a glance. */
function ProportionBar({ revenue, byType, net }) {
  const { t } = useI18n();
  if (revenue <= 0) return null;

  const segments = [
    { key: "fixed", value: byType.fixed ?? 0, className: "bg-info", label: t("expenses.fixed") },
    { key: "stock", value: byType.stock ?? 0, className: "bg-brass", label: t("expenses.stock") },
    { key: "oneoff", value: byType.oneoff ?? 0, className: "bg-muted", label: t("expenses.oneOff") },
    { key: "kept", value: Math.max(0, net), className: "bg-jade", label: t("expenses.kept") },
  ].filter((segment) => segment.value > 0);

  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <div className="mt-5">
      <p className="mb-2 text-2xs text-faint">{t("expenses.whereMoneyGoes")}</p>
      <div className="flex h-2 overflow-hidden rounded-full bg-bg">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full", segment.className)} />
            {segment.label}
            <span className="tnum font-mono text-faint">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpenseForm({ onDone, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    type: "fixed",
    description: "",
    amount: "",
    paidTo: "",
    date: toDateKey(new Date()),
  });
  const save = useAction(expensesApi.create);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await save.run({
      type: form.type,
      description: form.description.trim(),
      amount: Number(form.amount) || 0,
      paidTo: form.paidTo.trim() || null,
      date: form.date,
    });
    onDone();
  }

  return (
    <Panel>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t("expenses.type")}>
          <Select value={form.type} onChange={(event) => set("type", event.target.value)}>
            {TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {t(type.labelKey)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("expenses.description")} required className="lg:col-span-2">
          <Input
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            required
          />
        </Field>

        <Field label={t("expenses.amount")} required>
          <Input
            value={form.amount}
            onChange={(event) => set("amount", event.target.value)}
            inputMode="decimal"
            className="tnum text-right font-mono"
            required
          />
        </Field>

        <Field label={t("expenses.date")}>
          <Input
            type="date"
            value={form.date}
            onChange={(event) => set("date", event.target.value)}
            className="tnum font-mono"
          />
        </Field>

        <Field label={t("expenses.paidTo")} className="sm:col-span-2 lg:col-span-3">
          <Input value={form.paidTo} onChange={(event) => set("paidTo", event.target.value)} />
        </Field>

        <div className="flex items-end gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.pending}>
            {save.pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("state.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("state.cancel")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
