"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Plus, Check, Loader2 } from "lucide-react";
import { cn, money } from "@/lib/utils";
import { Money } from "@/components/ui/money";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input, ToggleGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/state";
import { banks as banksApi } from "@/lib/api";

/**
 * Everything between "the customer agreed" and "the money is in the till".
 *
 * Jade appears exactly once on this screen — on the button that commits the
 * sale. Reserving one colour for one irreversible action is what stops a
 * tired cashier confirming something they did not mean to.
 */
export function CheckoutPanel({ lines, banksQuery, onCheckout, pending }) {
  const { t } = useI18n();

  const [discountMode, setDiscountMode] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [method, setMethod] = useState("cash");
  const [bankId, setBankId] = useState(null);
  const [tendered, setTendered] = useState("");
  const [addingBank, setAddingBank] = useState(false);
  const [newBank, setNewBank] = useState("");
  const [bankError, setBankError] = useState(null);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
    [lines]
  );

  const discount = useMemo(() => {
    const raw = Number(discountValue) || 0;
    if (raw <= 0) return 0;
    const amount = discountMode === "percent" ? (subtotal * raw) / 100 : raw;
    return Math.min(amount, subtotal);
  }, [discountValue, discountMode, subtotal]);

  const total = Math.max(0, subtotal - discount);
  const tenderedNum = Number(tendered) || 0;
  const change = tenderedNum - total;

  const allBanks = banksQuery.data ?? [];
  const activeBanks = useMemo(
    () => allBanks.filter((bank) => bank.active !== false),
    [allBanks]
  );

  // Preselect when there is only one bank — a till should not ask a question
  // that has only one possible answer.
  useEffect(() => {
    if (method !== "card") return;
    if (bankId && activeBanks.some((bank) => bank.id === bankId)) return;
    if (activeBanks.length === 1) setBankId(activeBanks[0].id);
  }, [method, bankId, activeBanks]);

  const cardWithoutBank = method === "card" && activeBanks.length > 0 && !bankId;
  const cashShort = method === "cash" && tendered !== "" && change < 0;
  const blocked = !lines.length || pending || cardWithoutBank || cashShort;

  async function addBank(event) {
    event.preventDefault();
    const name = newBank.trim();
    if (!name) return;
    if (allBanks.some((bank) => bank.name.toLowerCase() === name.toLowerCase())) {
      setBankError(t("settings.bankExists"));
      return;
    }
    try {
      const created = await banksApi.create({ name });
      await banksQuery.reload();
      setBankId(created.id);
      setNewBank("");
      setAddingBank(false);
      setBankError(null);
    } catch {
      setBankError(t("state.errorTitle"));
    }
  }

  function submit() {
    onCheckout({
      discount: discount > 0 ? { mode: discountMode, value: Number(discountValue) } : null,
      payment: {
        method,
        bankId: method === "card" ? bankId : null,
        tendered: method === "cash" && tendered !== "" ? tenderedNum : null,
      },
      totals: { subtotal, discount, total },
    });
  }

  return (
    <aside className="flex flex-col gap-px overflow-hidden rounded border border-line bg-line">
      <div className="space-y-2 bg-surface p-4">
        <Row label={t("pos.subtotal")} value={money(subtotal)} />

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted">{t("pos.discount")}</span>
          <div className="flex items-center gap-1.5">
            <ToggleGroup
              size="sm"
              value={discountMode}
              onChange={setDiscountMode}
              options={[
                { value: "percent", label: "%" },
                { value: "fixed", label: "₾" },
              ]}
              className="w-[74px]"
            />
            <Input
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="tnum h-7 w-[72px] text-right font-mono text-[13px]"
            />
          </div>
        </div>

        {discount > 0 && <Row label="" value={`− ${money(discount)}`} tone="text-brass" small />}
      </div>

      <div className="bg-surface px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">{t("pos.total")}</span>
          <Money value={total} className="text-2xl text-fg" />
        </div>
      </div>

      <div className="space-y-3 bg-surface p-4">
        <ToggleGroup
          value={method}
          onChange={(next) => {
            setMethod(next);
            if (next === "cash") setBankId(null);
          }}
          options={[
            {
              value: "cash",
              label: t("pos.cash"),
              icon: <Banknote className="h-3.5 w-3.5" strokeWidth={1.8} />,
            },
            {
              value: "card",
              label: t("pos.card"),
              icon: <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />,
            },
          ]}
          className="w-full"
        />

        {method === "cash" && (
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1.5 block text-2xs text-muted">{t("pos.tendered")}</span>
              <Input
                value={tendered}
                onChange={(event) => setTendered(event.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="tnum text-right font-mono"
              />
            </label>
            {tendered !== "" && (
              <div className="flex items-baseline justify-between">
                <span className="text-2xs text-muted">
                  {change >= 0 ? t("pos.change") : t("pos.short")}
                </span>
                <span
                  className={cn(
                    "tnum font-mono text-[15px]",
                    change >= 0 ? "text-fg" : "text-danger"
                  )}
                >
                  {money(Math.abs(change))}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div className="space-y-2">
            <span className="block text-2xs text-muted">{t("pos.whichBank")}</span>

            {banksQuery.loading ? (
              <Skeleton className="h-9 w-full" />
            ) : activeBanks.length === 0 && !addingBank ? (
              <div className="rounded border border-dashed border-line px-3 py-3 text-center">
                <p className="text-2xs text-muted">{t("pos.noBanks")}</p>
                <p className="mt-0.5 text-[10px] text-faint">{t("pos.noBanksHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {activeBanks.map((bank) => {
                  const selected = bank.id === bankId;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setBankId(bank.id)}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded border px-2.5 text-[13px] transition-colors",
                        selected
                          ? "border-brass bg-brass-dim text-brass"
                          : "border-line bg-bg text-muted hover:border-line-strong hover:text-fg"
                      )}
                    >
                      {selected && <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />}
                      <span className="truncate">{bank.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {addingBank ? (
              <form onSubmit={addBank} className="flex gap-1.5">
                <Input
                  autoFocus
                  value={newBank}
                  onChange={(event) => {
                    setNewBank(event.target.value);
                    setBankError(null);
                  }}
                  placeholder={t("settings.bankName")}
                  className="h-9 text-[13px]"
                />
                <Button type="submit" size="sm" className="h-9 shrink-0">
                  {t("state.add")}
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingBank(true)}
                className="flex items-center gap-1.5 text-2xs text-muted transition-colors hover:text-brass"
              >
                <Plus className="h-3 w-3" strokeWidth={2} />
                {t("pos.addBank")}
              </button>
            )}

            {bankError && <p className="text-[10px] text-danger">{bankError}</p>}
          </div>
        )}
      </div>

      <div className="bg-surface p-4">
        <Button variant="confirm" size="xl" className="w-full" disabled={blocked} onClick={submit}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("pos.processing")}
            </>
          ) : (
            t("pos.checkout")
          )}
        </Button>
      </div>
    </aside>
  );
}

function Row({ label, value, tone, small }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={cn("text-[13px] text-muted", small && "text-2xs")}>{label}</span>
      <span className={cn("tnum font-mono text-[13px]", tone ?? "text-fg")}>{value}</span>
    </div>
  );
}
