"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn, money } from "@/lib/utils";

export function CartTable({ lines, onQty, onRemove }) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded border border-dashed border-line py-20 text-center">
        <p className="text-sm text-muted">Cart is empty</p>
        <p className="text-2xs text-faint">Scan an item to start the sale</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden rounded border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-faint">
              <th className="py-2.5 pl-4 pr-3 font-normal">Product</th>
              <th className="px-3 py-2.5 font-normal">Category</th>
              <th className="px-3 py-2.5 text-center font-normal">Qty</th>
              <th className="px-3 py-2.5 text-right font-normal">Unit price</th>
              <th className="px-3 py-2.5 text-right font-normal">Total</th>
              <th className="w-10 py-2.5 pr-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map(({ product, qty }) => {
              const overStock = qty > product.quantity;
              return (
                <tr key={product.id} className="group hover:bg-elevated/50">
                  <td className="py-3 pl-4 pr-3">
                    <p className="text-[13px] leading-tight text-fg">{product.name}</p>
                    <p className="mt-0.5 font-mono text-2xs text-faint">{product.sku}</p>
                    {overStock && (
                      <p className="mt-0.5 font-mono text-2xs text-danger">
                        Only {product.quantity} in stock
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-2xs text-muted">
                    {product.subcategory}
                    <span className="block text-faint">{product.category}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="mx-auto flex w-[104px] items-center justify-between rounded border border-line bg-bg">
                      <StepBtn onClick={() => onQty(product.id, -1)} label="Decrease">
                        <Minus className="h-3 w-3" strokeWidth={2.2} />
                      </StepBtn>
                      <span
                        className={cn(
                          "font-mono text-sm tnum",
                          overStock ? "text-danger" : "text-fg"
                        )}
                      >
                        {qty}
                      </span>
                      <StepBtn onClick={() => onQty(product.id, 1)} label="Increase">
                        <Plus className="h-3 w-3" strokeWidth={2.2} />
                      </StepBtn>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] text-muted tnum">
                    {money(product.sellPrice)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] font-medium text-fg tnum">
                    {money(product.sellPrice * qty)}
                  </td>
                  <td className="py-3 pr-3">
                    <button
                      onClick={() => onRemove(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
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
    </div>
  );
}

function StepBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center text-faint transition-colors hover:bg-elevated hover:text-fg"
    >
      {children}
    </button>
  );
}
