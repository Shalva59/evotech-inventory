"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { QuickAddSelect } from "@/components/inventory/QuickAddSelect";
import { DevicePicker } from "@/components/inventory/DevicePicker";
import { useApi } from "@/lib/hooks";
import {
  brands as brandsApi,
  categories as categoriesApi,
  devices as devicesApi,
  products as productsApi,
  suppliers as suppliersApi,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Money } from "@/components/ui/money";

const BLANK = {
  name: "",
  barcode: "",
  sku: "",
  categoryId: null,
  subcategoryId: null,
  brandId: null,
  supplierId: null,
  deviceIds: [],
  costPrice: "",
  sellPrice: "",
  quantity: "",
  minStockThreshold: "",
  imageUrl: null,
};

/** Fields kept after "save and next": a box of twenty Baseus cables shares them. */
const STICKY = ["categoryId", "subcategoryId", "brandId", "supplierId", "deviceIds", "minStockThreshold"];

function fromProduct(product) {
  if (!product) return BLANK;
  return {
    ...BLANK,
    ...product,
    deviceIds: product.deviceIds ?? [],
    costPrice: String(product.costPrice ?? ""),
    sellPrice: String(product.sellPrice ?? ""),
    quantity: String(product.quantity ?? ""),
    minStockThreshold: String(product.minStockThreshold ?? ""),
  };
}

export function ProductModal({ open, product, onClose, onSaved }) {
  const { t } = useI18n();
  const editing = Boolean(product?.id);

  const [form, setForm] = useState(() => fromProduct(product));
  const [initial, setInitial] = useState(() => fromProduct(product));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const barcodeRef = useRef(null);

  // Fresh state whenever the modal opens for a different product.
  useEffect(() => {
    if (!open) return;
    const start = fromProduct(product);
    setForm(start);
    setInitial(start);
    setError(null);
    setFlash(false);
  }, [open, product]);

  const categories = useApi(() => categoriesApi.list(), [open], { enabled: open });
  const brands = useApi(() => brandsApi.list(), [open], { enabled: open });
  const devices = useApi(() => devicesApi.list(), [open], { enabled: open });
  const suppliers = useApi(() => suppliersApi.list(), [open], { enabled: open });

  const subcategories = useMemo(
    () => (categories.data ?? []).find((c) => c.id === form.categoryId)?.subcategories ?? [],
    [categories.data, form.categoryId]
  );

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // A subcategory belongs to one category; switching category clears it.
      if (key === "categoryId") next.subcategoryId = null;
      return next;
    });
    if (error) setError(null);
  }

  function requestClose() {
    if (dirty && !pending) setConfirmClose(true);
    else onClose();
  }

  const cost = Number(form.costPrice) || 0;
  const sell = Number(form.sellPrice) || 0;
  const margin = sell - cost;
  const marginPct = cost > 0 ? (margin / cost) * 100 : null;
  const losing = cost > 0 && sell > 0 && sell < cost;

  async function save(andNext) {
    if (!form.name.trim() || !form.barcode.trim() || !form.sellPrice) {
      setError(t("state.errorTitle"));
      return;
    }

    setPending(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      sku: form.sku.trim() || null,
      categoryId: form.categoryId || null,
      subcategoryId: form.subcategoryId || null,
      brandId: form.brandId || null,
      supplierId: form.supplierId || null,
      deviceIds: form.deviceIds,
      costPrice: cost,
      sellPrice: sell,
      quantity: Number(form.quantity) || 0,
      minStockThreshold: Number(form.minStockThreshold) || 0,
      imageUrl: form.imageUrl || null,
    };

    try {
      const saved = editing
        ? await productsApi.update(product.id, payload)
        : await productsApi.create(payload);
      onSaved?.(saved);

      if (andNext) {
        const keep = Object.fromEntries(STICKY.map((key) => [key, form[key]]));
        const next = { ...BLANK, ...keep };
        setForm(next);
        setInitial(next);
        setFlash(true);
        setTimeout(() => setFlash(false), 2400);
        requestAnimationFrame(() => barcodeRef.current?.focus());
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message === "NETWORK" ? t("state.offline") : err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        size="lg"
        title={editing ? t("inventory.editProduct") : t("inventory.newProduct")}
        subtitle={flash ? undefined : editing ? form.name : undefined}
        footer={
          <>
            {flash && (
              <span className="mr-auto flex items-center gap-1.5 text-[12px] text-jade">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("inventory.savedNext")}
              </span>
            )}
            {error && !flash && (
              <span className="mr-auto max-w-[40ch] truncate text-[12px] text-danger">{error}</span>
            )}
            <Button type="button" variant="ghost" onClick={requestClose} disabled={pending}>
              {t("state.cancel")}
            </Button>
            {!editing && (
              <Button type="button" variant="outline" onClick={() => save(true)} disabled={pending}>
                {t("inventory.saveAndNext")}
              </Button>
            )}
            <Button type="button" onClick={() => save(false)} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("state.save")}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save(false);
          }}
          className="grid gap-px bg-line lg:grid-cols-[1fr_280px]"
        >
          {/* Left: what it is */}
          <div className="space-y-6 bg-surface p-5">
            <Section>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("inventory.name")} required className="sm:col-span-2">
                  <Input
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    placeholder="Spigen Ultra Hybrid iPhone 15"
                    autoFocus={!editing}
                  />
                </Field>
                <Field label={t("inventory.barcode")} required>
                  <Input
                    ref={barcodeRef}
                    value={form.barcode}
                    onChange={(event) => set("barcode", event.target.value)}
                    className="font-mono"
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
            </Section>

            <Section title={t("inventory.category")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickAddSelect
                  label={t("inventory.category")}
                  value={form.categoryId}
                  onChange={(id) => set("categoryId", id)}
                  options={categories.data ?? []}
                  onCreate={async (name) => {
                    const created = await categoriesApi.create({ name });
                    await categories.reload();
                    return created;
                  }}
                />
                <QuickAddSelect
                  label={t("inventory.subcategory")}
                  value={form.subcategoryId}
                  onChange={(id) => set("subcategoryId", id)}
                  options={subcategories}
                  disabled={!form.categoryId}
                  hint={!form.categoryId ? t("inventory.pickFirst") : undefined}
                  onCreate={async (name) => {
                    const created = await categoriesApi.createSubcategory(form.categoryId, name);
                    await categories.reload();
                    return created;
                  }}
                />
                <QuickAddSelect
                  label={t("inventory.brandLabel")}
                  value={form.brandId}
                  onChange={(id) => set("brandId", id)}
                  options={brands.data ?? []}
                  onCreate={async (name) => {
                    const created = await brandsApi.create({ name });
                    await brands.reload();
                    return created;
                  }}
                />
                <QuickAddSelect
                  label={t("inventory.supplier")}
                  value={form.supplierId}
                  onChange={(id) => set("supplierId", id)}
                  options={suppliers.data ?? []}
                  onCreate={async (name) => {
                    const created = await suppliersApi.create({ name });
                    await suppliers.reload();
                    return created;
                  }}
                />
              </div>
            </Section>

            {/* Collapsed by default. Most accessories fit everything, so this
                only matters for cases, screens and glass — it should not be
                the third thing the eye lands on. */}
            <Collapsible
              title={t("inventory.compatible")}
              hint={t("inventory.compatibleHint")}
              count={form.deviceIds.length}
              defaultOpen={form.deviceIds.length > 0}
            >
              <DevicePicker
                value={form.deviceIds}
                onChange={(ids) => set("deviceIds", ids)}
                devices={devices.data ?? []}
                onCreate={async (data) => {
                  const created = await devicesApi.create(data);
                  await devices.reload();
                  return created;
                }}
              />
            </Collapsible>
          </div>

          {/* Right: what it costs and how many */}
          <div className="space-y-5 bg-surface p-5">
            <ImagePicker
              label={t("inventory.photo")}
              value={form.imageUrl}
              onChange={(value) => set("imageUrl", value)}
              className="mx-auto max-w-[180px] lg:max-w-none"
            />

            <div className="space-y-4 rounded border border-line bg-bg/50 p-4">
              <Field label={t("inventory.costPrice")}>
                <Input
                  value={form.costPrice}
                  onChange={(event) => set("costPrice", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tnum text-right font-mono"
                />
              </Field>
              <Field label={t("inventory.sellPrice")} required>
                <Input
                  value={form.sellPrice}
                  onChange={(event) => set("sellPrice", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={cn("tnum text-right font-mono", losing && "border-danger")}
                />
              </Field>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-2xs text-muted">{t("inventory.margin")}</span>
                <span
                  className={cn(
                    "text-[13px]",
                    losing ? "text-danger" : margin > 0 ? "text-jade" : "text-faint"
                  )}
                >
                  <Money value={margin} />
                  {marginPct != null && (
                    <span className="tnum font-mono"> · {marginPct.toFixed(0)}%</span>
                  )}
                </span>
              </div>
              {losing && <p className="text-[11px] text-danger">{t("inventory.negativeMargin")}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("inventory.stock")}>
                <Input
                  value={form.quantity}
                  onChange={(event) => set("quantity", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="tnum text-right font-mono"
                />
              </Field>
              <Field label={t("inventory.minStock")}>
                <Input
                  value={form.minStockThreshold}
                  onChange={(event) => set("minStockThreshold", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="tnum text-right font-mono"
                />
              </Field>
            </div>
            <p className="-mt-2 text-[11px] leading-relaxed text-faint">{t("inventory.minStockHint")}</p>
          </div>

          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmClose}
        title={t("state.cancel")}
        message={t("inventory.closeConfirm")}
        confirmLabel={t("state.cancel")}
        cancelLabel={t("state.back")}
        danger
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
      />
    </>
  );
}

function Collapsible({ title, hint, count, defaultOpen, children }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-faint transition-transform", !open && "-rotate-90")}
          strokeWidth={2}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-fg">{title}</span>
          {!open && hint && (
            <span className="mt-0.5 block truncate text-[11px] text-faint">{hint}</span>
          )}
        </span>
        <span className="shrink-0 text-[11px] text-faint">
          {count > 0 ? count : t("inventory.universal")}
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-3.5 py-3.5">
          {hint && <p className="mb-2.5 text-[11px] leading-relaxed text-faint">{hint}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

function Section({ title, hint, children }) {
  return (
    <section>
      {title && (
        <div className="mb-3">
          <h3 className="text-[13px] font-medium text-fg">{title}</h3>
          {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-faint">{hint}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
