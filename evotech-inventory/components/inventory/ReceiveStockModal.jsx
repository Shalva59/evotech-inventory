"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Checkbox } from "@/components/ui/field";
import { useApi } from "@/lib/hooks";
import { products as productsApi, suppliers as suppliersApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/utils";

/**
 * Goods arrive. Quantity goes up, cost becomes the weighted average, and —
 * unless it was bought on credit — the payment lands in Expenses as a stock
 * purchase, so the owner never has to type the same number twice.
 */
export function ReceiveStockModal({ open, product, onClose, onSaved }) {
  const { t } = useI18n();
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [recordExpense, setRecordExpense] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const suppliers = useApi(() => suppliersApi.list(), [open], { enabled: open });

  useEffect(() => {
    if (!open || !product) return;
    setQty("");
    setUnitCost(product.costPrice ? String(product.costPrice) : "");
    setSupplierId(product.supplierId ?? "");
    setRecordExpense(true);
    setError(null);
  }, [open, product]);

  const q = Number(qty) || 0;
  const c = Number(unitCost) || 0;
  const onHand = Math.max(0, product?.quantity ?? 0);
  const newCost = onHand + q > 0 ? (onHand * (product?.costPrice ?? 0) + q * c) / (onHand + q) : c;

  async function submit(event) {
    event.preventDefault();
    if (q <= 0) return;
    setPending(true);
    setError(null);
    try {
      const saved = await productsApi.receive(product.id, {
        qty: q,
        unitCost: c,
        supplierId: supplierId || null,
        recordExpense,
      });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message === "NETWORK" ? t("state.offline") : err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      dismissable
      title={t("inventory.receiveTitle")}
      subtitle={product?.name}
      footer={
        <>
          {error && <span className="mr-auto text-[12px] text-danger">{error}</span>}
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("state.cancel")}
          </Button>
          <Button type="submit" form="receive-form" disabled={pending || q <= 0}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("inventory.receive")}
          </Button>
        </>
      }
    >
      <form id="receive-form" onSubmit={submit} className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("inventory.receiveQty")} required>
            <Input
              autoFocus
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              inputMode="numeric"
              className="tnum text-right font-mono"
            />
          </Field>
          <Field label={t("inventory.receiveCost")}>
            <Input
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
              inputMode="decimal"
              className="tnum text-right font-mono"
            />
          </Field>
        </div>

        <Field label={t("inventory.supplier")}>
          <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            <option value="">—</option>
            {(suppliers.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-1.5 rounded border border-line bg-bg/50 p-3 text-[12px]">
          <Line label={t("inventory.stock")} value={`${product?.quantity ?? 0} → ${(product?.quantity ?? 0) + q}`} />
          <Line
            label={t("inventory.costPrice")}
            value={`${money(product?.costPrice ?? 0)} → ${money(newCost)}`}
          />
          <Line label={t("inventory.receiveTotal")} value={money(q * c)} strong />
          <p className="pt-1 text-[10px] leading-relaxed text-faint">{t("inventory.costAveraged")}</p>
        </div>

        <Checkbox
          checked={recordExpense}
          onChange={() => setRecordExpense((v) => !v)}
          label={t("inventory.recordExpense")}
          description={t("inventory.recordExpenseHint")}
        />
      </form>
    </Modal>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={strong ? "tnum font-mono text-fg" : "tnum font-mono text-muted"}>{value}</span>
    </div>
  );
}
