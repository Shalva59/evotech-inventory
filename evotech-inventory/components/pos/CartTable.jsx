"use client";

import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { cn, money } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/ui/state";

export function CartTable({ lines, onChangeQty, onRemove }) {
  const { t } = useI18n();

  if (!lines.length) {
    return (
      <div className="rounded border border-line bg-surface">
        <EmptyState title={t("pos.emptyCart")} hint={t("pos.emptyCartHint")} icon={ShoppingCart} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-line bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line text-left text-2xs text-faint">
            <th className="px-4 py-2.5 font-normal">{t("pos.product")}</th>
            <th className="hidden px-4 py-2.5 font-normal sm:table-cell">{t("pos.category")}</th>
            <th className="px-4 py-2.5 text-center font-normal">{t("pos.qty")}</th>
            <th className="hidden px-4 py-2.5 text-right font-normal sm:table-cell">
              {t("pos.unitPrice")}
            </th>
            <th className="px-4 py-2.5 text-right font-normal">{t("pos.lineTotal")}</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((line) => {
            const short = line.qty > line.available;
            return (
              <tr key={line.productId} className="group">
                <td className="px-4 py-3">
                  <span className="block text-[13px] text-fg">{line.name}</span>
                  <span className="block font-mono text-[10px] text-faint">{line.barcode}</span>
                  {short && (
                    <span className="mt-0.5 block text-[10px] text-danger">
                      {t("pos.outOfStockWarn")} · {line.available}
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-[13px] text-muted sm:table-cell">
                  {line.category}
                </td>
                <td className="px-4 py-3">
                  <div className="mx-auto flex w-fit items-center gap-1 rounded border border-line bg-bg">
                    <button
                      type="button"
                      onClick={() => onChangeQty(line.productId, line.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center text-faint transition-colors hover:text-fg"
                      aria-label="-1"
                    >
                      <Minus className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <span
                      className={cn(
                        "tnum w-7 text-center font-mono text-[13px]",
                        short ? "text-danger" : "text-fg"
                      )}
                    >
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeQty(line.productId, line.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center text-faint transition-colors hover:text-fg"
                      aria-label="+1"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </td>
                <td className="tnum hidden px-4 py-3 text-right font-mono text-[13px] text-muted sm:table-cell">
                  {money(line.unitPrice)}
                </td>
                <td className="tnum px-4 py-3 text-right font-mono text-[13px] text-fg">
                  {money(line.unitPrice * line.qty)}
                </td>
                <td className="pr-3">
                  <button
                    type="button"
                    onClick={() => onRemove(line.productId)}
                    className="flex h-7 w-7 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={t("state.remove")}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
