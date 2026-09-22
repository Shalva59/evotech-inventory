"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Tick every phone or laptop an accessory fits.
 *
 * Chips for what is already chosen, a search box beneath, results grouped by
 * maker. If the search finds nothing, the first row becomes "add it" — so a
 * new model can be created without leaving the product form.
 */
export function DevicePicker({ value = [], onChange, devices = [], onCreate }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => value.map((id) => devices.find((d) => d.id === id)).filter(Boolean),
    [value, devices]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? devices.filter((d) => `${d.maker} ${d.name}`.toLowerCase().includes(q))
      : devices;
    return pool.slice(0, 40);
  }, [devices, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const device of matches) {
      const key = device.maker || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(device);
    }
    return [...map.entries()];
  }, [matches]);

  const exact = devices.some((d) => d.name.toLowerCase() === query.trim().toLowerCase());

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  async function create() {
    const name = query.trim();
    if (!name || !onCreate) return;
    setPending(true);
    try {
      const created = await onCreate({ name, maker: guessMaker(name) });
      onChange([...value, created.id]);
      setQuery("");
      inputRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((device) => (
            <span
              key={device.id}
              className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-brass/50 bg-brass-dim/50 pl-2.5 pr-1 text-[12px] text-brass"
            >
              {device.name}
              <button
                type="button"
                onClick={() => toggle(device.id)}
                className="flex h-5 w-5 items-center justify-center rounded-sm text-brass/70 hover:bg-brass/20 hover:text-brass"
                aria-label={t("state.remove")}
              >
                <X className="h-3 w-3" strokeWidth={2.2} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
          strokeWidth={1.8}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (matches.length === 1) toggle(matches[0].id);
              else if (!exact && query.trim()) create();
            }
          }}
          placeholder={t("inventory.pickDevices")}
          className="h-10 w-full rounded border border-line bg-bg pl-9 pr-3 text-sm text-fg placeholder:text-faint transition-colors hover:border-line-strong focus:border-brass focus:outline-none"
        />

        {open && (
          <div className="absolute inset-x-0 top-11 z-20 max-h-[240px] overflow-y-auto rounded border border-line-strong bg-elevated py-1">
            {query.trim() && !exact && onCreate && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={create}
                disabled={pending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-brass hover:bg-surface"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                {t("catalog.quickAdd")}: <span className="font-medium">{query.trim()}</span>
              </button>
            )}

            {grouped.length === 0 && !query.trim() && (
              <p className="px-3 py-3 text-[12px] text-faint">{t("inventory.noDevicesYet")}</p>
            )}

            {grouped.map(([maker, list]) => (
              <div key={maker}>
                <p className="px-3 pb-1 pt-2 text-[10px] text-faint">{maker}</p>
                {list.map((device) => {
                  const on = value.includes(device.id);
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => toggle(device.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-surface",
                        on ? "text-fg" : "text-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                          on ? "border-brass bg-brass" : "border-line-strong"
                        )}
                      >
                        {on && <Check className="h-3 w-3 text-brass-fg" strokeWidth={3} />}
                      </span>
                      {device.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Fills in the maker for the obvious cases so a quick-added "iPhone 15" is
 * filed under Apple. Anything unrecognised is left blank to edit later.
 */
export function guessMaker(name) {
  const n = name.toLowerCase();
  if (/^(iphone|ipad|macbook|airpods|apple watch|imac)/.test(n)) return "Apple";
  if (/^(galaxy|samsung)/.test(n)) return "Samsung";
  if (/^(redmi|xiaomi|poco|mi )/.test(n)) return "Xiaomi";
  if (/^pixel/.test(n)) return "Google";
  if (/^(huawei|mate |p\d)/.test(n)) return "Huawei";
  if (/^(honor)/.test(n)) return "Honor";
  if (/^(oppo|reno|find x)/.test(n)) return "OPPO";
  if (/^(vivo)/.test(n)) return "vivo";
  if (/^(realme)/.test(n)) return "realme";
  if (/^(oneplus)/.test(n)) return "OnePlus";
  if (/^(thinkpad|lenovo|ideapad|legion)/.test(n)) return "Lenovo";
  if (/^(zenbook|vivobook|rog|asus)/.test(n)) return "ASUS";
  if (/^(xps|inspiron|latitude|dell)/.test(n)) return "Dell";
  if (/^(pavilion|elitebook|hp )/.test(n)) return "HP";
  return "";
}
