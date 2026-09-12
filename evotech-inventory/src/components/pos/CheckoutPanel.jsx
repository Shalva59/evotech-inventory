"use client";

import { Banknote, CreditCard, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, ToggleGroup } from "@/components/ui/field";
import { cn, money } from "@/lib/utils";

export function CheckoutPanel({
  subtotal,
  itemCount,
  discountMode,
  discountValue,
  discountAmount,
  total,
  payment,
  cashTendered,
  onDiscountMode,
  onDiscountValue,
  onPayment,
  onCashTendered,
  onCheckout,
  disabled,
}) {
  const change = typeof cashTendered === "number" ? cashTendered - total : 0;

  return (
    <aside className="flex w-full flex-col rounded border border-line bg-surface xl:sticky xl:top-[72px] xl:w-[340px] xl:shrink-0">
      <div className="space-y-4 border-b border-line p-5">
        {/* Discount */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] text-muted">Discount</span>
            <ToggleGroup
              size="sm"
              value={discountMode}
              onChange={onDiscountMode}
              options={[
                { value: "percent", label: "%" },
                { value: "fixed", label: "₾" },
              ]}
              className="w-[92px]"
            />
          </div>
          <Input
            type="number"
            min={0}
            max={discountMode === "percent" ? 100 : undefined}
            value={discountValue || ""}
            onChange={(e) => onDiscountValue(Number(e.target.value) || 0)}
            placeholder={discountMode === "percent" ? "0" : "0.00"}
            className="font-mono tnum"
          />
        </div>

        {/* Payment method */}
        <div>
          <span className="mb-2 block text-[13px] text-muted">Payment method</span>
          <ToggleGroup
            value={payment}
            onChange={onPayment}
            options={[
              {
                value: "cash",
                label: "Cash",
                icon: <Banknote className="h-4 w-4" strokeWidth={1.8} />,
              },
              {
                value: "card",
                label: "Card",
                icon: <CreditCard className="h-4 w-4" strokeWidth={1.8} />,
              },
            ]}
            className="w-full"
          />
        </div>

        {/* Cash tendered — only relevant for cash, so it appears only then */}
        {payment === "cash" && (
          <div>
            <span className="mb-2 block text-[13px] text-muted">Cash received</span>
            <Input
              type="number"
              min={0}
              value={cashTendered}
              onChange={(e) =>
                onCashTendered(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={total.toFixed(2)}
              className="font-mono tnum"
            />
            {typeof cashTendered === "number" && cashTendered > 0 && (
              <p
                className={cn(
                  "mt-2 flex justify-between font-mono text-[13px] tnum",
                  change < 0 ? "text-danger" : "text-jade"
                )}
              >
                <span className="font-sans text-muted">
                  {change < 0 ? "Still owed" : "Change due"}
                </span>
                {money(Math.abs(change))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-2 p-5">
        <Line
          label={`Subtotal (${itemCount} item${itemCount === 1 ? "" : "s"})`}
          value={money(subtotal)}
        />
        {discountAmount > 0 && (
          <Line
            label={`Discount${discountMode === "percent" ? ` (${discountValue}%)` : ""}`}
            value={`− ${money(discountAmount)}`}
            tone="text-danger"
          />
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="font-mono text-[28px] font-semibold leading-none tracking-tight text-fg tnum">
            {money(total)}
          </span>
        </div>
      </div>

      <div className="p-5 pt-0">
        <Button
          variant="confirm"
          size="xl"
          onClick={onCheckout}
          disabled={disabled}
          className="w-full"
        >
          <Printer className="h-5 w-5" strokeWidth={1.8} />
          Checkout &amp; print receipt
        </Button>
        <p className="mt-2.5 text-center text-2xs text-faint">
          Stock levels update the moment the receipt prints
        </p>
      </div>
    </aside>
  );
}

function Line({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={cn("font-mono tnum", tone ?? "text-fg")}>{value}</span>
    </div>
  );
}
