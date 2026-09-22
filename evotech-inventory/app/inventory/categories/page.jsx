"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { IconPicker } from "@/components/inventory/IconPicker";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Async, EmptyState, Skeleton } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { categories as categoriesApi } from "@/lib/api";
import { colorFor, fallbackColor, iconFor } from "@/lib/catalog-style";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const list = useApi(() => categoriesApi.list(), []);

  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dragId, setDragId] = useState(null);
  // Pressing "+" on a tile opens the category with its add field already live.
  const [addSubTo, setAddSubTo] = useState(null);

  const items = list.data ?? [];
  const open = items.find((c) => c.id === openId) ?? null;

  /** Reorder is optimistic: the tile follows the cursor, then we persist. */
  async function drop(targetId) {
    if (!dragId || dragId === targetId) return setDragId(null);
    const ordered = [...items];
    const from = ordered.findIndex((c) => c.id === dragId);
    const to = ordered.findIndex((c) => c.id === targetId);
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    setDragId(null);
    list.setData(ordered);
    await Promise.all(
      ordered.map((category, index) =>
        categoriesApi.update(category.id, { sortOrder: index }),
      ),
    );
    list.reload();
  }

  return (
    <>
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("catalog.categoryAdd")}</span>
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

        <Async
          query={list}
          isEmpty={(data) => !data?.length}
          skeleton={
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[118px]" />
              ))}
            </div>
          }
          empty={
            <div className="rounded border border-line bg-surface">
              <EmptyState
                icon={FolderTree}
                title={t("catalog.categoriesEmpty")}
                hint={t("catalog.categoriesEmptyHint")}
                action={
                  <Button size="sm" onClick={() => setEditing({})}>
                    {t("catalog.categoryAdd")}
                  </Button>
                }
              />
            </div>
          }
        >
          {() =>
            open ? (
              <CategoryDetail
                category={open}
                onBack={() => setOpenId(null)}
                onEdit={() => setEditing(open)}
                onDelete={() =>
                  open.productCount > 0
                    ? setNotice(t("catalog.inUse"))
                    : setDeleting(open)
                }
                onChanged={list.reload}
                onBlocked={() => setNotice(t("catalog.inUse"))}
                onOpenProducts={(params) => router.push(`/inventory?${params}`)}
                autoAddSub={addSubTo === open.id}
                onAutoAddHandled={() => setAddSubTo(null)}
              />
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {items.map((category) => (
                    <CategoryTile
                      key={category.id}
                      category={category}
                      dragging={dragId === category.id}
                      onOpen={() => setOpenId(category.id)}
                      onAddSub={() => {
                        setOpenId(category.id);
                        setAddSubTo(category.id);
                      }}
                      onEdit={() => setEditing(category)}
                      onDelete={() =>
                        category.productCount > 0
                          ? setNotice(t("catalog.inUse"))
                          : setDeleting(category)
                      }
                      onDragStart={() => setDragId(category.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => drop(category.id)}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-faint">
                  {t("catalog.dragHint")}
                </p>
              </>
            )
          }
        </Async>
      </main>

      <CategoryModal
        open={editing !== null}
        category={editing?.id ? editing : null}
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
            await categoriesApi.remove(deleting.id);
            setOpenId(null);
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

/* ------------------------------------------------------------------ */

/**
 * A calm row, not a poster.
 *
 * The first version let an uploaded picture fill the whole tile behind the
 * text. Shop logos are high-contrast by design, so a red logo turned into a
 * red billboard with unreadable white text on it. Now every image sits inside
 * a fixed square and is scaled to fit; the category colour survives only as a
 * tinted square and a hairline. Whatever anyone uploads, the grid stays even.
 */
function CategoryTile({
  category,
  onOpen,
  dragging,
  onAddSub,
  onEdit,
  onDelete,
  ...dragProps
}) {
  const { t } = useI18n();
  const Icon = iconFor(category.icon);
  const color = colorFor(category.color ?? fallbackColor(category.name));
  const empty = category.productCount === 0;
  const subs = category.subcategories;

  return (
    <article
      draggable
      {...dragProps}
      style={{ "--tile": color }}
      className={cn(
        "group flex flex-col rounded-lg border border-line bg-surface transition-colors",
        "hover:border-[hsl(var(--tile)/0.55)]",
        dragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3.5 px-4 pb-3 pt-4 text-left"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded"
          style={{ background: `hsl(${color} / 0.15)` }}
        >
          {category.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.image}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Icon
              className="h-5 w-5"
              strokeWidth={1.7}
              style={{ color: `hsl(${color})` }}
            />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-tight text-fg">
            {category.name}
          </span>
          <span
            className={cn(
              "mt-1 block text-[11px]",
              empty ? "text-faint" : "text-muted",
            )}
          >
            {t("catalog.productsCount", { n: category.productCount })}
          </span>
        </span>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </button>

      {/* Subcategories are the reason anyone opens this page, so they are
          visible from the grid rather than one click away. */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-2.5">
        {subs.slice(0, 3).map((sub) => (
          <span
            key={sub.id}
            className="truncate rounded-sm bg-elevated px-2 py-0.5 text-[11px] text-muted"
          >
            {sub.name}
          </span>
        ))}
        {subs.length > 3 && (
          <span className="text-[11px] text-faint">+{subs.length - 3}</span>
        )}
        {subs.length === 0 && (
          <span className="text-[11px] text-faint">
            {t("catalog.noSubcategories")}
          </span>
        )}

        <span className="ml-auto flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <TileAction label={t("catalog.subcategoryAdd")} onClick={onAddSub}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </TileAction>
          <TileAction label={t("state.edit")} onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
          </TileAction>
          <TileAction label={t("state.remove")} onClick={onDelete} danger>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          </TileAction>
        </span>
      </div>
    </article>
  );
}

function TileAction({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded text-faint transition-colors",
        danger
          ? "hover:bg-danger-dim hover:text-danger"
          : "hover:bg-elevated hover:text-brass",
      )}
    >
      {children}
    </button>
  );
}

function CategoryDetail({
  category,
  onBack,
  onEdit,
  onDelete,
  onChanged,
  onBlocked,
  onOpenProducts,
  autoAddSub,
  onAutoAddHandled,
}) {
  const { t } = useI18n();
  const Icon = iconFor(category.icon);
  const color = colorFor(category.color ?? fallbackColor(category.name));

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setAdding(Boolean(autoAddSub));
    setName("");
    if (autoAddSub) onAutoAddHandled?.();
  }, [category.id, autoAddSub, onAutoAddHandled]);

  async function addSub(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setPending(true);
    try {
      await categoriesApi.createSubcategory(category.id, value);
      setName("");
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function removeSub(sub) {
    if (sub.productCount > 0) return onBlocked();
    try {
      await categoriesApi.removeSubcategory(sub.id);
      onChanged();
    } catch {
      onBlocked();
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        {t("catalog.categories")}
      </button>

      <header
        style={{ "--tile": color }}
        className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-5"
      >
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded"
          style={{ background: `hsl(${color} / 0.18)` }}
        >
          {category.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon
              className="h-6 w-6"
              strokeWidth={1.7}
              style={{ color: `hsl(${color})` }}
            />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl text-fg">{category.name}</h2>
          <p className="mt-0.5 text-[12px]" style={{ color: `hsl(${color})` }}>
            {t("catalog.productsCount", { n: category.productCount })}
          </p>
          {category.description && (
            <p className="mt-2 max-w-[64ch] text-[12px] leading-relaxed text-muted">
              {category.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenProducts(`categoryId=${category.id}`)}
          >
            {t("catalog.showAll")}
          </Button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded text-faint transition-colors hover:bg-elevated hover:text-brass"
            aria-label={t("state.edit")}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded text-faint transition-colors hover:bg-danger-dim hover:text-danger"
            aria-label={t("state.remove")}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <section>
        <p className="mb-2.5 text-[11px] text-faint">
          {t("catalog.subcategories")}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {category.subcategories.map((sub) => (
            <div
              key={sub.id}
              style={{ "--tile": color }}
              className="group flex items-center gap-2 rounded border border-line bg-surface px-3 py-2.5 transition-colors hover:border-[hsl(var(--tile)/0.5)]"
            >
              <button
                type="button"
                onClick={() => onOpenProducts(`subcategoryId=${sub.id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-[13px] text-fg">
                  {sub.name}
                </span>
                <span className="block text-[10px] text-faint">
                  {t("catalog.productsCount", { n: sub.productCount })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeSub(sub)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-danger-dim hover:text-danger group-hover:opacity-100"
                aria-label={t("state.remove")}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}

          {adding ? (
            <form
              onSubmit={addSub}
              className="flex items-center gap-2 rounded border border-brass bg-surface px-3"
            >
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => !name.trim() && setAdding(false)}
                placeholder={t("catalog.subcategoryPlaceholder")}
                className="h-[46px] min-w-0 flex-1 bg-transparent text-[13px] text-fg placeholder:text-faint focus:outline-none"
              />
              {pending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-faint" />
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-1.5 rounded border border-dashed border-line-strong px-3 py-2.5 text-[12px] text-faint transition-colors hover:border-brass hover:text-brass"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              {t("catalog.subcategoryAdd")}
            </button>
          )}
        </div>

        {category.subcategories.length === 0 && !adding && (
          <p className="mt-3 text-[12px] text-faint">
            {t("catalog.noSubcategories")}
          </p>
        )}
      </section>
    </div>
  );
}

function CategoryModal({ open, category, onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: null,
    icon: "package",
    color: "brass",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: category?.name ?? "",
      description: category?.description ?? "",
      image: category?.image ?? null,
      icon: category?.icon ?? "package",
      color: category?.color ?? fallbackColor(category?.name ?? ""),
    });
    setError(null);
  }, [open, category]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setPending(true);
    setError(null);
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    };
    try {
      if (category) await categoriesApi.update(category.id, payload);
      else await categoriesApi.create(payload);
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
      title={category ? t("catalog.categoryEdit") : t("catalog.categoryAdd")}
      footer={
        <>
          {error && (
            <span className="mr-auto text-[12px] text-danger">{error}</span>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("state.cancel")}
          </Button>
          <Button
            type="submit"
            form="category-form"
            disabled={pending || !form.name.trim()}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("state.save")}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-5 p-5">
        <Field label={t("catalog.categoryName")} required>
          <Input
            autoFocus
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder={t("catalog.categoryNamePlaceholder")}
          />
        </Field>

        <div>
          <span className="mb-2 block text-[13px] text-muted">
            {t("catalog.appearance")}
          </span>
          <IconPicker
            icon={form.icon}
            color={form.color}
            onChange={({ icon, color }) =>
              setForm((c) => ({ ...c, icon, color }))
            }
          />
        </div>

        <div className="flex items-start gap-5">
          <ImagePicker
            label={t("catalog.image")}
            value={form.image}
            onChange={(value) => set("image", value)}
            className="w-[104px] shrink-0"
          />
          <Field
            label={t("catalog.description")}
            hint={t("catalog.descriptionHint")}
            className="flex-1"
          >
            <Textarea
              rows={4}
              maxLength={160}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              className="resize-none"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
