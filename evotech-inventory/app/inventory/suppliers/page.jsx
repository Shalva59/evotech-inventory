"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Phone, Plus, Trash2, Truck } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Async, EmptyState, SkeletonRows } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { suppliers as suppliersApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function SuppliersPage() {
  const { t } = useI18n();
  const list = useApi(() => suppliersApi.list(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState(null);

  return (
    <>
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("catalog.supplierAdd")}</span>
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

        <div className="overflow-hidden rounded border border-line bg-surface">
          <Async
            query={list}
            isEmpty={(data) => !data?.length}
            skeleton={<SkeletonRows rows={4} className="p-4" />}
            empty={
              <EmptyState
                icon={Truck}
                title={t("catalog.suppliersEmpty")}
                hint={t("catalog.suppliersEmptyHint")}
                action={
                  <Button size="sm" onClick={() => setEditing({})}>
                    {t("catalog.supplierAdd")}
                  </Button>
                }
              />
            }
          >
            {(items) => (
              <ul className="divide-y divide-line">
                {items.map((supplier) => (
                  <li key={supplier.id} className="group flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-fg">{supplier.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-faint">
                        {[supplier.contactPerson, t("catalog.productsCount", { n: supplier.productCount })]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {supplier.note && (
                        <p className="mt-1 truncate text-[12px] text-muted">{supplier.note}</p>
                      )}
                    </div>

                    {supplier.phone && (
                      <a
                        href={`tel:${supplier.phone.replace(/\s/g, "")}`}
                        className="hidden shrink-0 items-center gap-1.5 font-mono text-[12px] text-muted transition-colors hover:text-brass sm:flex"
                      >
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {supplier.phone}
                      </a>
                    )}

                    <div className="flex shrink-0 gap-0.5 opacity-50 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditing(supplier)}
                        className="flex h-8 w-8 items-center justify-center rounded text-faint hover:bg-elevated hover:text-brass"
                        aria-label={t("state.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          supplier.productCount > 0
                            ? setNotice(t("catalog.inUse"))
                            : setDeleting(supplier)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded text-faint hover:bg-danger-dim hover:text-danger"
                        aria-label={t("state.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Async>
        </div>
      </main>

      <SupplierModal
        open={editing !== null}
        supplier={editing?.id ? editing : null}
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
            await suppliersApi.remove(deleting.id);
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

function SupplierModal({ open, supplier, onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", phone: "", contactPerson: "", note: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: supplier?.name ?? "",
      phone: supplier?.phone ?? "",
      contactPerson: supplier?.contactPerson ?? "",
      note: supplier?.note ?? "",
    });
    setError(null);
  }, [open, supplier]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setPending(true);
    setError(null);
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    try {
      if (supplier) await suppliersApi.update(supplier.id, payload);
      else await suppliersApi.create(payload);
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
      title={supplier ? t("catalog.supplierEdit") : t("catalog.supplierAdd")}
      footer={
        <>
          {error && <span className="mr-auto text-[12px] text-danger">{error}</span>}
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("state.cancel")}
          </Button>
          <Button type="submit" form="supplier-form" disabled={pending || !form.name.trim()}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("state.save")}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={t("catalog.supplierName")} required className="sm:col-span-2">
          <Input autoFocus value={form.name} onChange={(event) => set("name", event.target.value)} />
        </Field>
        <Field label={t("catalog.phone")}>
          <Input
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            inputMode="tel"
            placeholder="+995 5xx xx xx xx"
            className="font-mono"
          />
        </Field>
        <Field label={t("catalog.contactPerson")}>
          <Input
            value={form.contactPerson}
            onChange={(event) => set("contactPerson", event.target.value)}
          />
        </Field>
        <Field label={t("catalog.note")} className="sm:col-span-2">
          <Textarea
            rows={2}
            value={form.note}
            onChange={(event) => set("note", event.target.value)}
            placeholder={t("catalog.notePlaceholder")}
            className="resize-none"
          />
        </Field>
      </form>
    </Modal>
  );
}
