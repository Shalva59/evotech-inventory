"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Power, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch, ToggleGroup } from "@/components/ui/field";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi, useAction } from "@/lib/hooks";
import { banks as banksApi, settings as settingsApi, notifications, DEMO } from "@/lib/api";
import { resetLocalData } from "@/lib/local-backend";
import { useI18n, useTimeAgo } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();

  const config = useApi(() => settingsApi.get(), []);
  const banksQuery = useApi(() => banksApi.list(), []);
  const log = useApi(() => notifications.list(12), []);

  const [draft, setDraft] = useState(null);
  useEffect(() => {
    if (config.data) setDraft(config.data);
  }, [config.data]);

  const save = useAction(settingsApi.update);

  function patch(partial) {
    setDraft((current) => ({ ...current, ...partial }));
    save.run(partial).catch(() => config.reload());
  }

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <main className="grid gap-4 p-5 xl:grid-cols-2 xl:items-start">
        <div className="space-y-4">
          {/* Language — device-level, so it sits above anything stored server-side. */}
          <Panel>
            <PanelHeader title={t("settings.language")} meta={t("settings.languageHint")} />
            <ToggleGroup
              className="mt-4 w-full"
              value={lang}
              onChange={setLang}
              options={[
                { value: "ka", label: t("settings.georgian") },
                { value: "en", label: t("settings.english") },
              ]}
            />
          </Panel>

          <BankSettings query={banksQuery} />

          <Panel>
            <PanelHeader title={t("settings.attendanceTitle")} />
            <div className="mt-4">
              <Field label={t("settings.graceMinutes")} hint={t("settings.graceHint")}>
                <div className="relative max-w-[160px]">
                  <Input
                    value={draft?.lateGraceMinutes ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        lateGraceMinutes: event.target.value,
                      }))
                    }
                    onBlur={(event) =>
                      patch({ lateGraceMinutes: Number(event.target.value) || 0 })
                    }
                    inputMode="numeric"
                    className="tnum pr-16 text-right font-mono"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-faint">
                    {t("settings.minutes")}
                  </span>
                </div>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <TelegramSettings draft={draft} patch={patch} />

          <Panel>
            <PanelHeader title={t("settings.financeTitle")} />

            <div className="mt-4 space-y-5">
              <Field label={t("settings.reinvestPercent")} hint={t("settings.reinvestHint")}>
                <div className="flex gap-1.5">
                  {[20, 30, 40, 50].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => patch({ reinvestPercent: option })}
                      className={cn(
                        "tnum h-9 flex-1 rounded border text-[13px] transition-colors",
                        draft?.reinvestPercent === option
                          ? "border-brass bg-brass-dim text-brass"
                          : "border-line text-muted hover:border-line-strong hover:text-fg"
                      )}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </Field>

              {/* The one accounting decision that changes what "profit" means. */}
              <div>
                <span className="mb-2 block text-[13px] text-muted">
                  {t("settings.accounting")}
                </span>
                <div className="space-y-2">
                  {[
                    {
                      id: "cash",
                      label: t("settings.accountingCash"),
                      hint: t("settings.accountingCashHint"),
                    },
                    {
                      id: "cogs",
                      label: t("settings.accountingCogs"),
                      hint: t("settings.accountingCogsHint"),
                    },
                  ].map((option) => {
                    const selected = draft?.accounting === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => patch({ accounting: option.id })}
                        className={cn(
                          "flex w-full items-start gap-3 rounded border p-3 text-left transition-colors",
                          selected
                            ? "border-brass bg-brass-dim/40"
                            : "border-line bg-bg hover:border-line-strong"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            selected ? "border-brass bg-brass" : "border-line-strong"
                          )}
                        >
                          {selected && <Check className="h-2.5 w-2.5 text-brass-fg" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm text-fg">{option.label}</span>
                          <span className="mt-0.5 block text-2xs leading-relaxed text-faint">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <NotificationLog query={log} />

          {DEMO && <DemoPanel />}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */

function BankSettings({ query }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function add(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    if ((query.data ?? []).some((bank) => bank.name.toLowerCase() === value.toLowerCase())) {
      setError(t("settings.bankExists"));
      return;
    }
    setPending(true);
    try {
      await banksApi.create({ name: value });
      setName("");
      setError(null);
      query.reload();
    } catch {
      setError(t("state.errorTitle"));
    } finally {
      setPending(false);
    }
  }

  async function toggle(bank) {
    await banksApi.update(bank.id, { active: bank.active === false });
    query.reload();
  }

  async function remove(bank) {
    try {
      await banksApi.remove(bank.id);
    } catch {
      // A bank attached to past sales cannot be deleted without orphaning
      // those records, so the backend switches it off instead.
      await banksApi.update(bank.id, { active: false });
    }
    query.reload();
  }

  return (
    <Panel flush>
      <PanelHeader
        title={t("settings.banksTitle")}
        meta={t("settings.banksHint")}
        className="border-b border-line px-5 py-3.5"
      />

      <Async
        query={query}
        isEmpty={(data) => !data?.length}
        skeleton={<SkeletonRows rows={3} className="p-4" />}
        empty={<EmptyState title={t("pos.noBanks")} compact />}
      >
        {(items) => (
          <ul className="divide-y divide-line">
            {items.map((bank) => (
              <li key={bank.id} className="group flex items-center gap-3 px-5 py-2.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    bank.active === false ? "bg-faint" : "bg-jade"
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px]",
                    bank.active === false ? "text-faint line-through" : "text-fg"
                  )}
                >
                  {bank.name}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(bank)}
                  className="flex h-7 w-7 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-elevated hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={bank.active === false ? t("employees.active") : t("employees.inactive")}
                >
                  <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(bank)}
                  className="flex h-7 w-7 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={t("state.remove")}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Async>

      <form onSubmit={add} className="flex gap-2 border-t border-line p-4">
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder={t("settings.bankName")}
        />
        <Button type="submit" className="shrink-0" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2} />
          )}
          {t("settings.addBank")}
        </Button>
      </form>

      {error && <p className="px-4 pb-3 text-2xs text-danger">{error}</p>}
    </Panel>
  );
}

function TelegramSettings({ draft, patch }) {
  const { t } = useI18n();
  const [result, setResult] = useState(null);
  const test = useAction(settingsApi.testTelegram);

  async function sendTest() {
    try {
      await test.run();
      setResult("ok");
    } catch {
      setResult("fail");
    }
  }

  return (
    <Panel>
      <PanelHeader title={t("settings.notificationsTitle")} />

      <div className="mt-4 space-y-4">
        <Switch
          checked={Boolean(draft?.telegram?.enabled)}
          onChange={(value) =>
            patch({ telegram: { ...(draft?.telegram ?? {}), enabled: value } })
          }
          label={t("settings.telegramEnabled")}
          description={t("settings.telegramHint")}
        />

        <Field label={t("settings.telegramChatId")} hint={t("settings.telegramChatIdHint")}>
          <Input
            value={draft?.telegram?.chatId ?? ""}
            onChange={() => {}}
            readOnly
            className="font-mono text-muted"
            placeholder="—"
          />
        </Field>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={sendTest}
            disabled={test.pending || !draft?.telegram?.enabled}
          >
            {test.pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            {t("settings.telegramTest")}
          </Button>
          {result && (
            <span className={cn("text-2xs", result === "ok" ? "text-jade" : "text-danger")}>
              {result === "ok" ? t("settings.telegramSent") : t("settings.telegramFailed")}
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}

/**
 * Only rendered in demo mode. Clearing the browser store is the equivalent of
 * dropping the database, so it says so plainly rather than hiding behind an
 * icon.
 */
function DemoPanel() {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  return (
    <Panel className="border-brass/50">
      <PanelHeader
        title={t("settings.demoTitle")}
        meta={t("settings.demoHint")}
      />
      <div className="mt-4">
        {confirming ? (
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetLocalData();
                window.location.reload();
              }}
            >
              {t("settings.demoResetConfirm")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              {t("state.cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            {t("settings.demoReset")}
          </Button>
        )}
      </div>
    </Panel>
  );
}

function NotificationLog({ query }) {
  const { t } = useI18n();
  const timeAgo = useTimeAgo();

  return (
    <Panel flush>
      <PanelHeader
        title={t("settings.notificationLog")}
        className="border-b border-line px-5 py-3.5"
      />
      <Async
        query={query}
        isEmpty={(data) => !data?.length}
        skeleton={<SkeletonRows rows={3} className="p-4" />}
        empty={<EmptyState title={t("settings.noNotifications")} compact />}
      >
        {(items) => (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-2.5">
                <p className="text-[13px] text-fg">{item.text}</p>
                <p className="mt-0.5 text-[10px] text-faint">
                  {[item.channel, timeAgo(item.sentAt), item.delivered === false ? "✕" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Async>
    </Panel>
  );
}
