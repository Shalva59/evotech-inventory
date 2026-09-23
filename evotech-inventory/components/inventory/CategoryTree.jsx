"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Layers } from "lucide-react";
import { colorFor, fallbackColor, iconFor } from "@/lib/catalog-style";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The compact side of the catalogue: every category and subcategory in one
 * column, with a single control to open or close all of them.
 *
 * The tiles are for browsing; this is for working. Someone pricing up stock
 * wants to jump between "20W" and "Lightning cables" without walking back
 * through two screens each time.
 */
export function CategoryTree({ categories, value, onChange }) {
  const { t } = useI18n();
  const [openIds, setOpenIds] = useState([]);

  // Whatever is selected should be visible without hunting for it.
  useEffect(() => {
    if (!value?.subcategoryId) return;
    const parent = categories.find((c) =>
      c.subcategories.some((s) => s.id === value.subcategoryId)
    );
    if (parent) setOpenIds((current) => (current.includes(parent.id) ? current : [...current, parent.id]));
  }, [value?.subcategoryId, categories]);

  const allOpen = openIds.length === categories.length && categories.length > 0;

  function toggle(id) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  return (
    <div className="overflow-hidden rounded border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[11px] text-faint">{t("catalog.categories")}</span>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? [] : categories.map((c) => c.id))}
          className="text-[11px] text-faint transition-colors hover:text-brass"
        >
          {allOpen ? t("catalog.collapseAll") : t("catalog.expandAll")}
        </button>
      </div>

      <ul className="max-h-[calc(100vh-220px)] overflow-y-auto py-1">
        <li>
          <Row
            label={t("catalog.allProducts")}
            icon={Layers}
            active={!value?.categoryId && !value?.subcategoryId}
            onClick={() => onChange({})}
          />
        </li>

        {categories.map((category) => {
          const open = openIds.includes(category.id);
          const Icon = iconFor(category.icon);
          const color = colorFor(category.color ?? fallbackColor(category.name));
          const active = value?.categoryId === category.id && !value?.subcategoryId;

          return (
            <li key={category.id}>
              <div className="flex items-center">
                {category.subcategories.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggle(category.id)}
                    className="flex h-8 w-6 shrink-0 items-center justify-center text-faint hover:text-fg"
                    aria-label={open ? t("catalog.collapseAll") : t("catalog.expandAll")}
                  >
                    <ChevronRight
                      className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
                      strokeWidth={2}
                    />
                  </button>
                ) : (
                  <span className="w-6 shrink-0" />
                )}

                <button
                  type="button"
                  onClick={() => onChange({ categoryId: category.id })}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1.5 pr-3 text-left transition-colors",
                    active ? "text-fg" : "text-muted hover:text-fg"
                  )}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    strokeWidth={1.8}
                    style={{ color: `hsl(${color})` }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{category.name}</span>
                  <span className="tnum shrink-0 font-mono text-[10px] text-faint">
                    {category.productCount}
                  </span>
                </button>
              </div>

              {open && (
                <ul className="mb-1 ml-[22px] border-l border-line pl-2">
                  {category.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        onClick={() => onChange({ subcategoryId: sub.id })}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm py-1.5 pl-2 pr-3 text-left transition-colors",
                          value?.subcategoryId === sub.id
                            ? "bg-elevated text-fg"
                            : "text-muted hover:text-fg"
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate text-[12px]">{sub.name}</span>
                        <span className="tnum shrink-0 font-mono text-[10px] text-faint">
                          {sub.productCount}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Row({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 py-1.5 pl-6 pr-3 text-left transition-colors",
        active ? "text-fg" : "text-muted hover:text-fg"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.8} />
      <span className="truncate text-[13px]">{label}</span>
    </button>
  );
}
