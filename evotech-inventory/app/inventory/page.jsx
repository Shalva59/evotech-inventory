"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, PackageSearch, Search } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi, useDebounced } from "@/lib/hooks";
import { products } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn, money } from "@/lib/utils";

export default function InventoryPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const query = useDebounced(search, 300);

  const list = useApi(() => products.list(query ? { search: query } : undefined), [query]);

  return (
    <>
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button asChild size="sm">
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t("inventory.addProduct")}
            </Link>
          </Button>
        }
      />

      <main className="space-y-4 p-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" strokeWidth={1.8} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("inventory.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="overflow-hidden rounded border border-line bg-surface">
          <Async
            query={list}
            isEmpty={(data) => !data?.length}
            skeleton={<SkeletonRows rows={6} className="p-4" />}
            empty={
              <EmptyState
                icon={PackageSearch}
                title={query ? t("state.empty") : t("inventory.empty")}
                hint={query ? undefined : t("inventory.emptyHint")}
                action={
                  !query && (
                    <Button asChild size="sm">
                      <Link href="/inventory/new">{t("inventory.addProduct")}</Link>
                    </Button>
                  )
                }
              />
            }
          >
            {(items) => <ProductTable items={items} />}
          </Async>
        </div>
      </main>
    </>
  );
}

function ProductTable({ items }) {
  const { t } = useI18n();

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-line text-left text-2xs text-faint">
          <th className="px-4 py-2.5 font-normal">{t("inventory.name")}</th>
          <th className="hidden px-4 py-2.5 font-normal md:table-cell">{t("inventory.category")}</th>
          <th className="hidden px-4 py-2.5 text-right font-normal sm:table-cell">
            {t("inventory.costPrice")}
          </th>
          <th className="px-4 py-2.5 text-right font-normal">{t("inventory.sellPrice")}</th>
          <th className="px-4 py-2.5 text-right font-normal">{t("inventory.stock")}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {items.map((item) => {
          const low = item.quantity <= (item.minStockThreshold ?? 0);
          const out = item.quantity <= 0;
          return (
            <tr key={item.id} className="transition-colors hover:bg-elevated/50">
              <td className="px-4 py-3">
                <span className="block text-[13px] text-fg">{item.name}</span>
                <span className="block font-mono text-[10px] text-faint">
                  {[item.barcode, item.sku].filter(Boolean).join(" · ")}
                </span>
              </td>
              <td className="hidden px-4 py-3 text-[13px] text-muted md:table-cell">
                {[item.category, item.brand].filter(Boolean).join(" · ")}
              </td>
              <td className="tnum hidden px-4 py-3 text-right font-mono text-[13px] text-muted sm:table-cell">
                {money(item.costPrice ?? 0)}
              </td>
              <td className="tnum px-4 py-3 text-right font-mono text-[13px] text-fg">
                {money(item.sellPrice ?? 0)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={cn(
                    "tnum inline-block min-w-[2.5rem] rounded-sm px-2 py-1 font-mono text-[11px]",
                    out
                      ? "bg-danger-dim text-danger"
                      : low
                        ? "bg-brass-dim text-brass"
                        : "text-muted"
                  )}
                >
                  {item.quantity}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
