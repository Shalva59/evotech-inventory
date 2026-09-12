import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/lib/mock-data";
import { stockLevel } from "@/lib/types";
import { money } from "@/lib/utils";

const LEVEL_STYLES = {
  ok: { label: "in stock", text: "text-muted", border: "border-l-transparent" },
  low: { label: "low", text: "text-brass", border: "border-l-brass" },
  out: { label: "out", text: "text-danger", border: "border-l-danger" },
};

export default function InventoryPage() {
  const stockValue = PRODUCTS.reduce((s, p) => s + p.costPrice * p.quantity, 0);

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle={`${PRODUCTS.length} products · ${money(stockValue, {
          decimals: false,
        })} at cost`}
      >
        <Link href="/inventory/new">
          <Button size="sm">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add product
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 p-5 sm:p-6">
        <Panel flush>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-faint">
                  <th className="py-2.5 pl-4 pr-3 font-normal">Product</th>
                  <th className="px-3 py-2.5 font-normal">Classification</th>
                  <th className="px-3 py-2.5 text-right font-normal">Cost</th>
                  <th className="px-3 py-2.5 text-right font-normal">Sell</th>
                  <th className="px-3 py-2.5 text-right font-normal">Margin</th>
                  <th className="px-3 py-2.5 text-right font-normal">Qty / min</th>
                  <th className="py-2.5 pl-3 pr-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PRODUCTS.map((p) => {
                  const s = LEVEL_STYLES[stockLevel(p)];
                  const marginPct = ((p.sellPrice - p.costPrice) / p.sellPrice) * 100;
                  return (
                    <tr key={p.id} className={`border-l-2 ${s.border} hover:bg-elevated/50`}>
                      <td className="py-3 pl-4 pr-3">
                        <p className="text-[13px] leading-tight text-fg">{p.name}</p>
                        <p className="mt-0.5 font-mono text-2xs text-faint">{p.sku}</p>
                      </td>
                      <td className="px-3 py-3 text-2xs text-muted">
                        {p.subcategory}
                        <span className="block text-faint">
                          {p.brand} · {p.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] text-muted tnum">
                        {money(p.costPrice, { decimals: false })}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] text-fg tnum">
                        {money(p.sellPrice, { decimals: false })}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] text-jade tnum">
                        {marginPct.toFixed(0)}%
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] text-fg tnum">
                        {p.quantity}
                        <span className="ml-1 text-faint">/{p.minStockThreshold}</span>
                      </td>
                      <td className={`py-3 pl-3 pr-4 text-2xs ${s.text}`}>{s.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </>
  );
}
