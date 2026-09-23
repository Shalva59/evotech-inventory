"use client";

import { CATEGORY_ICONS, COLOR_KEYS, ICON_KEYS, colorFor, iconFor } from "@/lib/catalog-style";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Pick a symbol and a colour. Two rows, no dropdowns, no searching. */
export function IconPicker({ icon, color, onChange }) {
  const { t } = useI18n();
  const Active = iconFor(icon);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded"
          style={{
            background: `hsl(${colorFor(color)} / 0.16)`,
            border: `1px solid hsl(${colorFor(color)} / 0.4)`,
          }}
        >
          <Active className="h-5 w-5" strokeWidth={1.7} style={{ color: `hsl(${colorFor(color)})` }} />
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ icon, color: key })}
              aria-label={key}
              className={cn(
                "h-5 w-5 rounded-full transition-transform",
                color === key ? "ring-2 ring-fg/70 ring-offset-2 ring-offset-surface" : "hover:scale-110"
              )}
              style={{ background: `hsl(${colorFor(key)})` }}
            />
          ))}
        </div>
      </div>

      <div className="grid max-h-[104px] grid-cols-9 gap-1 overflow-y-auto rounded border border-line bg-bg p-1.5">
        {ICON_KEYS.map((key) => {
          const Icon = CATEGORY_ICONS[key];
          const active = icon === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ icon: key, color })}
              aria-label={key}
              className={cn(
                "flex h-8 items-center justify-center rounded-sm transition-colors",
                active ? "bg-elevated text-fg" : "text-faint hover:bg-elevated/60 hover:text-muted"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-faint">{t("catalog.iconHint")}</p>
    </div>
  );
}
