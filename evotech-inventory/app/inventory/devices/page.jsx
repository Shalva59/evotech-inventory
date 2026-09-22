"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Smartphone, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { guessMaker } from "@/components/inventory/DevicePicker";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { devices as devicesApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * Plain list, grouped by maker, with an add row pinned on top. Devices are
 * typed in dozens at a time, so this page is built for speed: type the
 * model, press Enter, type the next one. The maker fills itself in.
 */
export default function DevicesPage() {
  const { t } = useI18n();
  const list = useApi(() => devicesApi.list(), []);
  const [name, setName] = useState("");
  const [maker, setMaker] = useState("");
  const [makerTouched, setMakerTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const device of list.data ?? []) {
      const key = device.maker || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(device);
    }
    return [...map.entries()];
  }, [list.data]);

  async function add(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setPending(true);
    setError(null);
    try {
      await devicesApi.create({ name: value, maker: maker.trim() });
      setName("");
      if (!makerTouched) setMaker("");
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader title={t("inventory.title")}>
        <CatalogNav />
      </PageHeader>

      <main className="space-y-4 p-5">
        <p className="max-w-[70ch] text-[13px] leading-relaxed text-muted">
          {t("catalog.devicesExplain")}
        </p>

        <form
          onSubmit={add}
          className="flex flex-wrap items-end gap-2 rounded border border-line bg-surface p-4"
        >
          <label className="min-w-[200px] flex-[2]">
            <span className="mb-1.5 block text-[13px] text-muted">{t("catalog.deviceName")}</span>
            <Input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!makerTouched) setMaker(guessMaker(event.target.value));
                setError(null);
              }}
              placeholder={t("catalog.deviceNamePlaceholder")}
            />
          </label>
          <label className="min-w-[140px] flex-1">
            <span className="mb-1.5 block text-[13px] text-muted">{t("catalog.deviceMaker")}</span>
            <Input
              value={maker}
              onChange={(event) => {
                setMaker(event.target.value);
                setMakerTouched(Boolean(event.target.value));
              }}
              placeholder={t("catalog.deviceMakerPlaceholder")}
            />
          </label>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2} />}
            {t("state.add")}
          </Button>
          {error && <p className="w-full text-[12px] text-danger">{error}</p>}
        </form>

        <div className="overflow-hidden rounded border border-line bg-surface">
          <Async
            query={list}
            isEmpty={(data) => !data?.length}
            skeleton={<SkeletonRows rows={5} className="p-4" />}
            empty={
              <EmptyState
                icon={Smartphone}
                title={t("catalog.devicesEmpty")}
                hint={t("catalog.devicesEmptyHint")}
              />
            }
          >
            {() => (
              <div className="divide-y divide-line">
                {grouped.map(([group, items]) => (
                  <section key={group}>
                    <h3 className="bg-bg/40 px-4 py-2 text-[11px] text-faint">
                      {group} <span className="tnum font-mono">· {items.length}</span>
                    </h3>
                    <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((device) => (
                        <li
                          key={device.id}
                          className="group flex items-center gap-3 bg-surface px-4 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                            {device.name}
                          </span>
                          <span className="tnum shrink-0 font-mono text-[11px] text-faint">
                            {device.productCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleting(device)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger group-hover:opacity-100"
                            aria-label={t("state.remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Async>
        </div>
      </main>

      <ConfirmDialog
        open={deleting !== null}
        title={deleting?.name}
        message={t("catalog.deleteConfirm")}
        confirmLabel={t("state.remove")}
        cancelLabel={t("state.back")}
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          await devicesApi.remove(deleting.id);
          setDeleting(null);
          list.reload();
        }}
      />
    </>
  );
}
