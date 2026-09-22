"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PackagePlus,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { ProductModal } from "@/components/inventory/ProductModal";
import { ReceiveStockModal } from "@/components/inventory/ReceiveStockModal";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { CategoryTree } from "@/components/inventory/CategoryTree";
import { Thumb } from "@/components/ui/image-picker";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi, useDebounced } from "@/lib/hooks";
import {
  brands as brandsApi,
  categories as categoriesApi,
  products,
} from "@/lib/api";
import { colorFor, fallbackColor } from "@/lib/catalog-style";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Money } from "@/components/ui/money";

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <Inventory />
    </Suspense>
  );
}

function Inventory() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const query = useDebounced(search, 250);

  // The filter lives in the URL, so a tile on the catalogue page, the tree in
  // the sidebar and the browser's back button all drive the same thing.
  const filter = {
    categoryId: params.get("categoryId") || undefined,
    subcategoryId: params.get("subcategoryId") || undefined,
    brandId: params.get("brandId") || undefined,
  };

  const [editing, setEditing] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const key = `${query}|${filter.categoryId}|${filter.subcategoryId}|${filter.brandId}`;
  const list = useApi(
    () => products.list({ search: query || undefined, ...filter }),
    [key],
  );
  const categories = useApi(() => categoriesApi.list(), []);
  const brandList = useApi(() => brandsApi.list(), []);

  // The low-stock widget links here with ?focus=<id>; open that product.
  const focusId = params.get("focus");
  useEffect(() => {
    if (!focusId || !list.data) return;
    const found = list.data.find((p) => p.id === focusId);
    if (found) setEditing(found);
    router.replace("/inventory");
  }, [focusId, list.data, router]);

  function applyFilter(next) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) search.set(k, v);
    const qs = search.toString();
    router.push(qs ? `/inventory?${qs}` : "/inventory");
  }

  const activeChip = useMemo(() => {
    if (filter.subcategoryId) {
      for (const category of categories.data ?? []) {
        const sub = category.subcategories.find(
          (s) => s.id === filter.subcategoryId,
        );
        if (sub)
          return {
            label: `${category.name} · ${sub.name}`,
            color: category.color,
            name: category.name,
          };
      }
    }
    if (filter.categoryId) {
      const category = (categories.data ?? []).find(
        (c) => c.id === filter.categoryId,
      );
      if (category)
        return {
          label: category.name,
          color: category.color,
          name: category.name,
        };
    }
    if (filter.brandId) {
      const brand = (brandList.data ?? []).find((b) => b.id === filter.brandId);
      if (brand) return { label: brand.name, name: brand.name };
    }
    return null;
  }, [
    filter.categoryId,
    filter.subcategoryId,
    filter.brandId,
    categories.data,
    brandList.data,
  ]);

  const filtered = Boolean(query || activeChip);

  function refresh() {
    list.reload();
    categories.reload();
    brandList.reload();
  }

  return (
    <>
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">
              {t("inventory.addProduct")}
            </span>
          </Button>
        }
      >
        <CatalogNav />
      </PageHeader>

      <main className="grid gap-4 p-5 xl:grid-cols-[228px_1fr] xl:items-start">
        <div className="hidden xl:block">
          <CategoryTree
            categories={categories.data ?? []}
            value={filter}
            onChange={applyFilter}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                strokeWidth={1.8}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("inventory.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>

          {activeChip && (
            <div className="flex items-center gap-2">
              <span
                style={{
                  "--tile": colorFor(
                    activeChip.color ?? fallbackColor(activeChip.name),
                  ),
                }}
                className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-[hsl(var(--tile)/0.45)] bg-[hsl(var(--tile)/0.14)] pl-2.5 pr-1 text-[12px] text-fg"
              >
                {activeChip.label}
                <button
                  type="button"
                  onClick={() => applyFilter({})}
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-faint hover:text-fg"
                  aria-label={t("catalog.clearFilter")}
                >
                  <X className="h-3 w-3" strokeWidth={2.2} />
                </button>
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded border border-line bg-surface">
            <Async
              query={list}
              isEmpty={(data) => !data?.length}
              skeleton={<SkeletonRows rows={6} className="p-4" />}
              empty={
                <div>
                  <EmptyState
                    icon={PackageSearch}
                    title={filtered ? t("state.empty") : t("inventory.empty")}
                    hint={filtered ? undefined : t("inventory.emptyHint")}
                    action={
                      !filtered && (
                        <Button size="sm" onClick={() => setEditing({})}>
                          {t("inventory.addProduct")}
                        </Button>
                      )
                    }
                  />
                </div>
              }
            >
              {(items) => (
                <ProductTable
                  items={items}
                  onEdit={setEditing}
                  onReceive={setReceiving}
                  onDelete={setDeleting}
                />
              )}
            </Async>
          </div>
        </div>
      </main>

      <ProductModal
        open={editing !== null}
        product={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />

      <ReceiveStockModal
        open={receiving !== null}
        product={receiving}
        onClose={() => setReceiving(null)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={t("inventory.deleteProduct")}
        message={`${deleting?.name ?? ""} — ${t("inventory.deleteConfirm")}`}
        confirmLabel={t("state.remove")}
        cancelLabel={t("state.back")}
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          await products.remove(deleting.id);
          setDeleting(null);
          refresh();
        }}
      />
    </>
  );
}

function ProductTable({ items, onEdit, onReceive, onDelete }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-line text-left text-[11px] text-faint">
            <th className="py-2.5 pl-4 pr-3 font-normal">
              {t("inventory.name")}
            </th>
            <th className="hidden w-[150px] px-3 py-2.5 font-normal sm:table-cell">
              {t("inventory.brandLabel")}
            </th>
            <th className="hidden w-[170px] px-3 py-2.5 font-normal lg:table-cell">
              {t("inventory.category")}
            </th>
            <th className="hidden w-[110px] px-3 py-2.5 text-right font-normal md:table-cell">
              {t("inventory.costPrice")}
            </th>
            <th className="w-[110px] px-3 py-2.5 text-right font-normal">
              {t("inventory.sellPrice")}
            </th>
            <th className="w-[76px] px-3 py-2.5 text-right font-normal">
              {t("inventory.stock")}
            </th>
            <th className="w-[108px] pr-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => {
            const out = item.quantity <= 0;
            const low = item.quantity <= (item.minStockThreshold ?? 0);
            const devices = item.devices ?? [];

            return (
              <tr
                key={item.id}
                className="group transition-colors hover:bg-elevated/40"
              >
                <td className="py-2 pl-4 pr-3">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="flex w-full min-w-0 items-center gap-3 text-left"
                  >
                    <Thumb src={item.imageUrl} name={item.name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] leading-tight text-fg">
                        {item.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className="truncate font-mono text-[10px] text-faint">
                          {item.barcode}
                        </span>
                        {/* Only products that fit something specific say so. */}
                        {devices.length > 0 && (
                          <span className="truncate rounded-sm bg-elevated px-1.5 text-[10px] leading-4 text-muted">
                            {devices[0].name}
                            {devices.length > 1 && ` +${devices.length - 1}`}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </td>

                <td className="hidden px-3 py-2 sm:table-cell">
                  {item.brand ? (
                    <span className="flex items-center gap-2">
                      <Thumb src={item.brandLogo} name={item.brand} size={20} />
                      <span className="truncate text-[13px] text-muted">
                        {item.brand}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-faint">—</span>
                  )}
                </td>

                <td className="hidden px-3 py-2 lg:table-cell">
                  <span className="block truncate text-[13px] text-muted">
                    {item.category ?? "—"}
                  </span>
                  {item.subcategory && (
                    <span className="block truncate text-[10px] text-faint">
                      {item.subcategory}
                    </span>
                  )}
                </td>

                <td className="hidden px-3 py-2 text-right md:table-cell">
                  <Money
                    value={item.costPrice}
                    className="text-[13px] text-muted"
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  <Money
                    value={item.sellPrice}
                    className="text-[13px] text-fg"
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  <span
                    className={cn(
                      "tnum inline-block min-w-[2.25rem] rounded-sm px-1.5 py-0.5 font-mono text-[12px]",
                      out
                        ? "bg-danger-dim text-danger"
                        : low
                          ? "bg-brass-dim text-brass"
                          : "text-muted",
                    )}
                  >
                    {item.quantity}
                  </span>
                </td>

                <td className="pr-2">
                  <div className="flex justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <IconAction
                      label={t("inventory.receive")}
                      onClick={() => onReceive(item)}
                    >
                      <PackagePlus className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </IconAction>
                    <IconAction
                      label={t("state.edit")}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </IconAction>
                    <IconAction
                      label={t("state.remove")}
                      onClick={() => onDelete(item)}
                      danger
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </IconAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IconAction({ label, onClick, danger, floating, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded text-faint transition-colors",
        floating ? "h-7 w-7 bg-surface/90 backdrop-blur" : "h-8 w-8",
        danger
          ? "hover:bg-danger-dim hover:text-danger"
          : "hover:bg-elevated hover:text-brass",
      )}
    >
      {children}
    </button>
  );
}
