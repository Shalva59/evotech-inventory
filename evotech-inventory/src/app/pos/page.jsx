"use client";

import { useMemo, useState } from "react";
import { Clock, UserRound } from "lucide-react";
import { ScannerInput } from "@/components/pos/ScannerInput";
import { CartTable } from "@/components/pos/CartTable";
import { CheckoutPanel } from "@/components/pos/CheckoutPanel";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/lib/mock-data";
import { money } from "@/lib/utils";

/** Replace with the signed-in employee from the PIN login session. */
const CASHIER = { name: "Nino Kapanadze", terminal: "Terminal 2" };

export default function PosPage() {
  const [lines, setLines] = useState([]);
  const [notFound, setNotFound] = useState(null);
  const [discountMode, setDiscountMode] = useState("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [payment, setPayment] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");

  function addByCode(code) {
    const q = code.toLowerCase();
    const product = PRODUCTS.find(
      (p) =>
        p.barcode === code || p.sku.toLowerCase() === q || p.name.toLowerCase().includes(q)
    );

    if (!product) {
      setNotFound(code);
      return;
    }
    setNotFound(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId, delta) {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function resetSale() {
    setLines([]);
    setDiscountValue(0);
    setCashTendered("");
    setNotFound(null);
  }

  const { subtotal, discountAmount, total, itemCount } = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.product.sellPrice * l.qty, 0);
    const raw = discountMode === "percent" ? (sub * discountValue) / 100 : discountValue;
    const disc = Math.min(Math.max(raw, 0), sub);
    return {
      subtotal: sub,
      discountAmount: disc,
      total: sub - disc,
      itemCount: lines.reduce((s, l) => s + l.qty, 0),
    };
  }, [lines, discountMode, discountValue]);

  function checkout() {
    // POST /api/sales — then trigger the receipt printer and decrement stock.
    console.log({
      lines,
      subtotal,
      discountAmount,
      total,
      payment,
      cashier: CASHIER.name,
    });
    resetSale();
  }

  const today = new Date("2026-09-13T18:00:00");

  return (
    <>
      {/* POS gets its own header — the cashier's name and time are legally
          part of the receipt trail, so they stay visible at all times. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/90 px-5 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-[15px] font-medium text-fg">Point of sale</h1>
          <span className="hidden items-center gap-1.5 text-2xs text-muted sm:flex">
            <UserRound className="h-3.5 w-3.5 text-brass" strokeWidth={1.8} />
            {CASHIER.name}
            <span className="text-faint">· {CASHIER.terminal}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-2xs text-faint tnum sm:flex">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
            {today.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {today.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {lines.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetSale}>
              Clear sale
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-5 sm:p-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ScannerInput onSubmit={addByCode} notFound={notFound} />
          <CartTable lines={lines} onQty={changeQty} onRemove={removeLine} />

          {lines.length > 0 && (
            <p className="text-2xs text-faint">
              {itemCount} unit{itemCount === 1 ? "" : "s"} across {lines.length} line
              {lines.length === 1 ? "" : "s"} · gross margin{" "}
              <span className="font-mono text-muted tnum">
                {money(
                  lines.reduce(
                    (s, l) => s + (l.product.sellPrice - l.product.costPrice) * l.qty,
                    0
                  ) - discountAmount
                )}
              </span>
            </p>
          )}
        </div>

        <CheckoutPanel
          subtotal={subtotal}
          itemCount={itemCount}
          discountMode={discountMode}
          discountValue={discountValue}
          discountAmount={discountAmount}
          total={total}
          payment={payment}
          cashTendered={cashTendered}
          onDiscountMode={setDiscountMode}
          onDiscountValue={setDiscountValue}
          onPayment={setPayment}
          onCashTendered={setCashTendered}
          onCheckout={checkout}
          disabled={lines.length === 0}
        />
      </main>
    </>
  );
}
