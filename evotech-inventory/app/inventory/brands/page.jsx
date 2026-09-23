"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Async, EmptyState, Skeleton } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { brands as brandsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A brand here is two facts: what it is called and what its logo looks like.
 * Country, website and a description were in the way — nobody in a shop looks
 * any of them up mid-sale, and every extra field is one more blank box facing
 * whoever is entering twenty brands in a row.
 */
export default function BrandsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const list = useApi(() => brandsApi.list(), []);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = list.data ?? [];
    return q ? rows.filter((b) => b.name.toLowerCase().includes(q)) : rows;
  }, [list.data, query]);

  return (
    <>
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("catalog.brandAdd")}</span>
          </Button>
        }
      >
        <CatalogNav />
      </PageHeader>

      <main className="space-y-4 p-5">
        {notice && (
          <p className="rounded border border-brass/40 bg-brass-dim/40 px-3 py-2 text-[12px] text-brass">
            {notice}
          </p>
        )}

        {(list.data?.length ?? 0) > 8 && (
          <div className="relative max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              strokeWidth={1.8}
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("catalog.search")}
              className="pl-9"
            />
          </div>
        )}

        <Async
          query={list}
          isEmpty={(data) => !data?.length}
          skeleton={
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[132px] rounded-none" />
              ))}
            </div>
          }
          empty={
            <div className="rounded border border-line bg-surface">
              <EmptyState
                icon={Tag}
                title={t("catalog.brandsEmpty")}
                hint={t("catalog.brandsEmptyHint")}
                action={
                  <Button size="sm" onClick={() => setEditing({})}>
                    {t("catalog.brandAdd")}
                  </Button>
                }
              />
            </div>
          }
        >
          {() => (
            // Every logo sits in its own fixed square on the same neutral
            // ground. Left to their own dimensions, a wide wordmark and a
            // round badge make a grid look broken.
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {visible.map((brand) => {
                const empty = brand.productCount === 0;
                return (
                  <article
                    key={brand.id}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors",
                      "hover:border-line-strong",
                      empty && "opacity-60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/inventory?brandId=${brand.id}`)}
                      className="flex flex-1 flex-col items-center gap-3 px-3 pb-3 pt-5"
                    >
                      <span className="flex h-16 w-full items-center justify-center rounded bg-bg/70 px-3">
                        {brand.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.logo}
                            alt=""
                            className="max-h-12 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-faint">
                            {brand.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="w-full text-center">
                        <span className="block truncate text-[13px] text-fg">{brand.name}</span>
                        <span className="mt-0.5 block text-[11px] text-faint">
                          {t("catalog.productsCount", { n: brand.productCount })}
                        </span>
                      </span>
                    </button>

                    <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditing(brand)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-surface/90 text-faint hover:text-brass"
                        aria-label={t("state.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          brand.productCount > 0 ? setNotice(t("catalog.inUse")) : setDeleting(brand)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded bg-surface/90 text-faint hover:text-danger"
                        aria-label={t("state.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Async>
      </main>

      <BrandModal
        open={editing !== null}
        brand={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={list.reload}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={deleting?.name}
        message={t("catalog.deleteConfirm")}
        confirmLabel={t("state.remove")}
        cancelLabel={t("state.back")}
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await brandsApi.remove(deleting.id);
          } catch {
            setNotice(t("catalog.inUse"));
          }
          setDeleting(null);
          list.reload();
        }}
      />
    </>
  );
}

function BrandModal({ open, brand, onClose, onSaved }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(brand?.name ?? "");
    setLogo(brand?.logo ?? null);
    setError(null);
  }, [open, brand]);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      if (brand) await brandsApi.update(brand.id, { name: name.trim(), logo });
      else await brandsApi.create({ name: name.trim(), logo });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message === "NETWORK" ? t("state.offline") : err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={brand ? t("catalog.brandEdit") : t("catalog.brandAdd")}
      footer={
        <>
          {error && <span className="mr-auto text-[12px] text-danger">{error}</span>}
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("state.cancel")}
          </Button>
          <Button type="submit" form="brand-form" disabled={pending || !name.trim()}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("state.save")}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={submit} className="flex items-start gap-5 p-5">
        <ImagePicker
          label={t("catalog.logo")}
          value={logo}
          onChange={setLogo}
          className="w-[116px] shrink-0"
        />
        <Field label={t("catalog.brandName")} required className="flex-1">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("catalog.brandNamePlaceholder")}
          />
        </Field>
      </form>
    </Modal>
  );
}
