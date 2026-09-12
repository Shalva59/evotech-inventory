"use client";

import { useMemo, useState } from "react";
import { ImagePlus, ScanBarcode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { CLASSIFICATION, SUPPLIERS } from "@/lib/mock-data";
import { cn, money } from "@/lib/utils";

export function ProductForm() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageName, setImageName] = useState(null);

  // Dependent selects — each level resets the ones below it.
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [supplier, setSupplier] = useState("");

  const subcategories = category ? Object.keys(CLASSIFICATION[category] ?? {}) : [];
  const brands =
    category && subcategory ? Object.keys(CLASSIFICATION[category]?.[subcategory] ?? {}) : [];
  const models =
    category && subcategory && brand
      ? CLASSIFICATION[category]?.[subcategory]?.[brand] ?? []
      : [];

  const margin = useMemo(() => {
    if (costPrice === "" || sellPrice === "" || sellPrice <= 0) return null;
    const profit = sellPrice - costPrice;
    return { profit, pct: (profit / sellPrice) * 100 };
  }, [costPrice, sellPrice]);

  const stockValue = costPrice !== "" && quantity !== "" ? costPrice * quantity : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // POST /api/products
      }}
      className="grid grid-cols-1 gap-4 xl:grid-cols-3"
    >
      <div className="space-y-4 xl:col-span-2">
        {/* Media & identification */}
        <Panel>
          <PanelHeader title="Media and identification" meta="How staff find this item" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
            <label
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed transition-colors",
                imageName
                  ? "border-brass bg-brass-dim/25"
                  : "border-line-strong hover:border-brass hover:bg-elevated"
              )}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
              />
              <ImagePlus
                className={cn("h-6 w-6", imageName ? "text-brass" : "text-faint")}
                strokeWidth={1.6}
              />
              <span className="px-3 text-center text-2xs text-faint">
                {imageName ? imageName : "Product photo"}
              </span>
            </label>

            <div className="space-y-4">
              <Field label="Product name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="iPhone 13 Pro Screen (OLED)"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="SKU" required hint="Internal code used on shelf labels">
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="SCR-13P-OL"
                    className="font-mono"
                  />
                </Field>
                <Field label="Barcode" hint="Scan to fill automatically">
                  <div className="relative">
                    <ScanBarcode
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                      strokeWidth={1.8}
                    />
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="4820091001344"
                      className="pl-9 font-mono"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </Panel>

        {/* Classification */}
        <Panel>
          <PanelHeader
            title="Classification"
            meta="Each level narrows the next, so the catalogue stays consistent"
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" required>
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                  setBrand("");
                  setModel("");
                }}
              >
                <option value="">Select category</option>
                {Object.keys(CLASSIFICATION).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subcategory" required>
              <Select
                value={subcategory}
                disabled={!category}
                onChange={(e) => {
                  setSubcategory(e.target.value);
                  setBrand("");
                  setModel("");
                }}
              >
                <option value="">
                  {category ? "Select subcategory" : "Pick a category first"}
                </option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Brand" required>
              <Select
                value={brand}
                disabled={!subcategory}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setModel("");
                }}
              >
                <option value="">
                  {subcategory ? "Select brand" : "Pick a subcategory first"}
                </option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Model">
              <Select value={model} disabled={!brand} onChange={(e) => setModel(e.target.value)}>
                <option value="">{brand ? "Select model" : "Pick a brand first"}</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {category && (
            <p className="mt-4 border-t border-line pt-3 font-mono text-2xs text-faint">
              {[category, subcategory, brand, model].filter(Boolean).join("  ›  ")}
            </p>
          )}
        </Panel>

        {/* Stock management */}
        <Panel>
          <PanelHeader
            title="Stock management"
            meta="The minimum threshold drives the dashboard alert widget"
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Current quantity" required>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="font-mono tnum"
              />
            </Field>
            <Field label="Minimum stock alert" required hint="Alert fires at or below this">
              <Input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="4"
                className="font-mono tnum"
              />
            </Field>
            <Field label="Supplier">
              <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                <option value="">Select supplier</option>
                {SUPPLIERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>
      </div>

      {/* Financial sidebar — pricing decisions deserve their own space */}
      <div className="space-y-4">
        <Panel className="xl:sticky xl:top-[72px]">
          <PanelHeader title="Pricing" meta="Cost price feeds every profit figure in the system" />

          <div className="mt-4 space-y-4">
            <Field label="Cost price" required hint="What EVOTECH pays the supplier">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="font-mono tnum"
              />
            </Field>

            <Field label="Sell price" required hint="Shown to the customer at the counter">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="font-mono tnum"
              />
            </Field>

            {/* Live margin — catches mispriced items before they reach the shelf */}
            <div
              className={cn(
                "rounded border p-4 transition-colors",
                margin && margin.profit < 0
                  ? "border-danger/40 bg-danger-dim/40"
                  : "border-line bg-bg"
              )}
            >
              {margin ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-muted">Profit per unit</span>
                    <span
                      className={cn(
                        "font-mono text-xl font-semibold tnum",
                        margin.profit < 0 ? "text-danger" : "text-jade"
                      )}
                    >
                      {money(margin.profit)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-2xs">
                    <span className="text-faint">Margin</span>
                    <span
                      className={cn(
                        "font-mono tnum",
                        margin.profit < 0 ? "text-danger" : "text-muted"
                      )}
                    >
                      {margin.pct.toFixed(1)}%
                    </span>
                  </div>
                  {margin.profit < 0 && (
                    <p className="mt-2.5 text-2xs text-danger">
                      Sell price is below cost. This item loses money on every sale.
                    </p>
                  )}
                  {stockValue !== null && (
                    <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2.5 text-2xs">
                      <span className="text-faint">Capital tied up in this stock</span>
                      <span className="font-mono text-muted tnum">
                        {money(stockValue, { decimals: false })}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="flex items-center gap-2 text-2xs text-faint">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Enter both prices to see profit and margin
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2 border-t border-line pt-5">
            <Button type="submit" variant="primary" className="flex-1">
              Save product
            </Button>
            <Button type="button" variant="outline">
              Save &amp; add another
            </Button>
          </div>
        </Panel>
      </div>
    </form>
  );
}
