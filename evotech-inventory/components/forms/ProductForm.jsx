"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useApi, useAction } from "@/lib/hooks";
import { classification, products, suppliers as suppliersApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn, money } from "@/lib/utils";

const EMPTY = {
  name: "",
  barcode: "",
  sku: "",
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  modelId: "",
  costPrice: "",
  sellPrice: "",
  quantity: "",
  minStockThreshold: "",
  supplierId: "",
  imageUrl: "",
};

/**
 * Classification cascades for a reason: without it somebody eventually saves
 * a Marshall-brand iPhone 13 screen and the low-stock report stops meaning
 * anything. Each level clears the ones beneath it.
 */
export function ProductForm() {
  const { t } = useI18n();
  const router = useRouter();

  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(null);

  const tree = useApi(() => classification.tree(), []);
  const suppliers = useApi(() => suppliersApi.list(), []);
  const save = useAction(products.create);

  const categories = tree.data ?? [];
  const subcategories = useMemo(
    () => categories.find((c) => String(c.id) === form.categoryId)?.subcategories ?? [],
    [categories, form.categoryId]
  );
  const brands = useMemo(
    () => subcategories.find((s) => String(s.id) === form.subcategoryId)?.brands ?? [],
    [subcategories, form.subcategoryId]
  );
  const models = useMemo(
    () => brands.find((b) => String(b.id) === form.brandId)?.models ?? [],
    [brands, form.brandId]
  );

  function set(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "categoryId") Object.assign(next, { subcategoryId: "", brandId: "", modelId: "" });
      if (key === "subcategoryId") Object.assign(next, { brandId: "", modelId: "" });
      if (key === "brandId") Object.assign(next, { modelId: "" });
      return next;
    });
  }

  const cost = Number(form.costPrice) || 0;
  const sell = Number(form.sellPrice) || 0;
  const marginValue = sell - cost;
  const marginPct = cost > 0 ? (marginValue / cost) * 100 : 0;
  const losing = sell > 0 && cost > 0 && sell < cost;

  async function submit(event) {
    event.preventDefault();
    await save.run({
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      sku: form.sku.trim() || null,
      categoryId: form.categoryId || null,
      subcategoryId: form.subcategoryId || null,
      brandId: form.brandId || null,
      modelId: form.modelId || null,
      costPrice: cost,
      sellPrice: sell,
      quantity: Number(form.quantity) || 0,
      minStockThreshold: Number(form.minStockThreshold) || 0,
      supplierId: form.supplierId || null,
      imageUrl: form.imageUrl || null,
    });
    router.push("/inventory");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_300px] xl:items-start">
      <div className="space-y-4">
        <Panel flush>
          <PanelHeader
            title={t("inventory.newProduct")}
            className="border-b border-line px-5 py-3.5"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("inventory.name")} required className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                required
              />
            </Field>

            <Field label={t("inventory.barcode")} required>
              <Input
                value={form.barcode}
                onChange={(event) => set("barcode", event.target.value)}
                className="font-mono"
                required
              />
            </Field>

            <Field label={t("inventory.sku")}>
              <Input
                value={form.sku}
                onChange={(event) => set("sku", event.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader title={t("inventory.category")} className="border-b border-line px-5 py-3.5" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("inventory.category")}>
              <Select
                value={form.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                disabled={tree.loading}
              >
                <option value="">{t("state.none")}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={t("inventory.subcategory")}
              hint={!form.categoryId ? t("inventory.pickFirst") : undefined}
            >
              <Select
                value={form.subcategoryId}
                onChange={(event) => set("subcategoryId", event.target.value)}
                disabled={!form.categoryId}
              >
                <option value="">{t("state.none")}</option>
                {subcategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t("inventory.brand")}>
              <Select
                value={form.brandId}
                onChange={(event) => set("brandId", event.target.value)}
                disabled={!form.subcategoryId}
              >
                <option value="">{t("state.none")}</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t("inventory.model")}>
              <Select
                value={form.modelId}
                onChange={(event) => set("modelId", event.target.value)}
                disabled={!form.brandId}
              >
                <option value="">{t("state.none")}</option>
                {models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader title={t("inventory.stock")} className="border-b border-line px-5 py-3.5" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("inventory.quantity")} required>
              <Input
                value={form.quantity}
                onChange={(event) => set("quantity", event.target.value)}
                inputMode="numeric"
                className="tnum font-mono"
                required
              />
            </Field>

            <Field label={t("inventory.minStock")} hint={t("inventory.minStockHint")}>
              <Input
                value={form.minStockThreshold}
                onChange={(event) => set("minStockThreshold", event.target.value)}
                inputMode="numeric"
                className="tnum font-mono"
              />
            </Field>

            <Field label={t("inventory.supplier")} className="sm:col-span-2">
              <Select
                value={form.supplierId}
                onChange={(event) => set("supplierId", event.target.value)}
                disabled={suppliers.loading}
              >
                <option value="">{t("state.none")}</option>
                {(suppliers.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 xl:sticky xl:top-[72px]">
        <Panel>
          <PanelHeader title={t("inventory.photo")} meta={t("inventory.photoHint")} />
          <label
            className={cn(
              "mt-3 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded border border-dashed transition-colors",
              preview ? "border-line" : "border-line-strong hover:border-brass"
            )}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-faint" strokeWidth={1.6} />
                <span className="text-2xs text-faint">{t("inventory.upload")}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPreview(URL.createObjectURL(file));
                set("imageUrl", file.name);
              }}
            />
          </label>
        </Panel>

        <Panel>
          <div className="space-y-4">
            <Field label={t("inventory.costPrice")} required>
              <Input
                value={form.costPrice}
                onChange={(event) => set("costPrice", event.target.value)}
                inputMode="decimal"
                className="tnum text-right font-mono"
                required
              />
            </Field>

            <Field label={t("inventory.sellPrice")} required>
              <Input
                value={form.sellPrice}
                onChange={(event) => set("sellPrice", event.target.value)}
                inputMode="decimal"
                className={cn(
                  "tnum text-right font-mono",
                  losing && "border-danger focus:border-danger"
                )}
                required
              />
            </Field>

            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-2xs text-muted">{t("inventory.margin")}</span>
              <span
                className={cn(
                  "tnum font-mono text-[13px]",
                  losing ? "text-danger" : marginValue > 0 ? "text-jade" : "text-faint"
                )}
              >
                {money(marginValue)}
                {cost > 0 && ` · ${marginPct.toFixed(0)}%`}
              </span>
            </div>

            {losing && <p className="text-[10px] text-danger">{t("inventory.negativeMargin")}</p>}
          </div>
        </Panel>

        {save.error && (
          <p className="rounded border border-danger/40 bg-danger-dim px-3 py-2 text-2xs text-danger">
            {save.error.message === "NETWORK" ? t("state.offline") : save.error.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={save.pending}>
            {save.pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {save.pending ? t("state.saving") : t("state.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("state.cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}
