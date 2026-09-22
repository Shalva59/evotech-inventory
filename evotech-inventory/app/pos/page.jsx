"use client";

import { useState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ScannerInput } from "@/components/pos/ScannerInput";
import { CartTable } from "@/components/pos/CartTable";
import { CheckoutPanel } from "@/components/pos/CheckoutPanel";
import { Button } from "@/components/ui/button";
import { useApi, useAction, useNow } from "@/lib/hooks";
import { banks as banksApi, sales } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/utils";
import { clockTime } from "@/lib/dates";

export default function PosPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const now = useNow(60000);

  const [lines, setLines] = useState([]);
  const [receipt, setReceipt] = useState(null);

  const banksQuery = useApi(() => banksApi.list(), []);
  const checkout = useAction(sales.create);

  function addProduct(product) {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      // Rescanning the same item means "one more", not "add a second row".
      if (existing) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          unitPrice: product.sellPrice,
          costPrice: product.costPrice,
          available: product.quantity,
          qty: 1,
        },
      ];
    });
  }

  function changeQty(productId, qty) {
    if (qty <= 0) return removeLine(productId);
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, qty } : line))
    );
  }

  function removeLine(productId) {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  async function commit({ discount, payment, totals }) {
    const result = await checkout.run({
      items: lines.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        unitPrice: line.unitPrice,
      })),
      discount,
      payment,
      cashierId: user?.id,
    });
    setReceipt({ ...result, totals, payment });
    setLines([]);
  }

  const dateLabel = new Date().toLocaleDateString(lang === "ka" ? "ka-GE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (receipt) {
    return (
      <SaleDone
        receipt={receipt}
        onNext={() => {
          setReceipt(null);
          checkout.clearError();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t("pos.title")}
        subtitle={`${t("pos.cashier")}: ${user?.fullName ?? "—"} · ${dateLabel} · ${clockTime(now.toISOString())}`}
      />

      <main className="grid flex-1 gap-4 p-5 xl:grid-cols-[1fr_340px] xl:items-start">
        <div className="space-y-4">
          <ScannerInput onAdd={addProduct} disabled={checkout.pending} />
          <CartTable lines={lines} onChangeQty={changeQty} onRemove={removeLine} />
          {lines.length > 0 && (
            <button
              type="button"
              onClick={() => setLines([])}
              className="text-2xs text-faint transition-colors hover:text-danger"
            >
              {t("pos.clearCart")}
            </button>
          )}
          {checkout.error && (
            <p className="rounded border border-danger/40 bg-danger-dim px-3 py-2 text-[13px] text-danger">
              {checkout.error.message === "NETWORK"
                ? t("state.offline")
                : checkout.error.message || t("state.errorTitle")}
            </p>
          )}
        </div>

        <div className="xl:sticky xl:top-[72px]">
          <CheckoutPanel
            lines={lines}
            banksQuery={banksQuery}
            onCheckout={commit}
            pending={checkout.pending}
          />
        </div>
      </main>
    </>
  );
}

/**
 * A deliberate full-stop between customers. The cart clears itself, so the
 * next scan cannot land on the previous order.
 */
function SaleDone({ receipt, onNext }) {
  const { t } = useI18n();
  const change = receipt.change ?? null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-5 text-center">
      <CheckCircle2 className="h-8 w-8 text-jade" strokeWidth={1.5} />

      <div>
        <p className="text-[15px] text-fg">{t("pos.sold")}</p>
        <p className="mt-1 font-mono text-2xs text-faint">
          {t("pos.receiptNo")} {receipt.receiptNo ?? receipt.id}
        </p>
      </div>

      <div className="w-full max-w-[280px] rounded border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <span className="text-2xs text-muted">{t("pos.total")}</span>
          <p className="tnum mt-1 font-mono text-2xl text-fg">
            {money(receipt.total ?? receipt.totals.total)}
          </p>
        </div>
        {change != null && change > 0 && (
          <div className="flex items-baseline justify-between px-4 py-2.5">
            <span className="text-2xs text-muted">{t("pos.change")}</span>
            <span className="tnum font-mono text-[15px] text-brass">{money(change)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" strokeWidth={1.8} />
          {t("pos.printAgain")}
        </Button>
        <Button onClick={onNext}>{t("pos.newSale")}</Button>
      </div>
    </main>
  );
}
