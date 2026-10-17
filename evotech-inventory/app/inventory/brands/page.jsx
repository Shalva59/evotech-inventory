"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, Tag } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogNav } from "@/components/inventory/CatalogNav";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Async, EmptyState, Skeleton } from "@/components/ui/state";
import { useApi } from "@/lib/hooks";
import { brands as brandsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * ბრენდების გვერდი  (/inventory/brands)
 * ═════════════════════════════════════
 * ბრენდს სამი რამ აქვს: სახელი, ლოგო და აქტიურია თუ არა.
 *
 * როგორ მუშაობს:
 *   1. გვერდის გახსნისას → GET /api/v1/brands  (სია მოდის სერვერიდან)
 *   2. „ბრენდის დამატება“ → იხსნება ფორმა (BrandModal)
 *   3. „შენახვა“ → POST /api/v1/brands  →  შემდეგ ისევ GET (სია ახლდება)
 *   4. ბრენდები იყოფა ორ სექციად: „აქტიური“ და „გამორთული“
 *
 * სერვერთან ყველა მოთხოვნა lib/api.js-შია (brandsApi), აქ fetch არ იწერება.
 * რედაქტირება და წაშლა არ არის, რადგან API-ს PUT / DELETE ჯერ არ აქვს.
 *
 * კომპონენტები ამ ფაილში:
 *   BrandsPage — მთავარი გვერდი (სია, ძებნა, სექციები)
 *   BrandCard  — ერთი ბრენდის ბარათი
 *   BrandModal — ახალი ბრენდის დამატების ფორმა
 */
export default function BrandsPage() {
  const { t } = useI18n(); // t("...") — თარგმანი lib/i18n/ka.js-დან
  const router = useRouter(); // სხვა გვერდზე გადასასვლელად

  // ბრენდების სია სერვერიდან.
  // list.data    — ბრენდების მასივი: [{ id, name, isActive, logo }, ...]
  // list.loading — იტვირთება თუ არა
  // list.error   — შეცდომა, თუ მოხდა
  // list.reload  — სიის თავიდან წამოღება (ახალი GET)
  const list = useApi(() => brandsApi.list(), []);

  const [query, setQuery] = useState(""); // ძებნის ველის ტექსტი
  const [adding, setAdding] = useState(false); // ღიაა თუ არა დამატების ფორმა
  const [notice, setNotice] = useState(null); // შეტყობინება გვერდის თავში

  // ძებნით გაფილტრული ბრენდები (სახელში ვეძებთ, დიდ/პატარა ასოს არ აქვს მნიშვნელობა).
  // useMemo — თავიდან ითვლება მხოლოდ მაშინ, როცა სია ან ძებნის ტექსტი იცვლება.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = list.data ?? [];
    return q ? rows.filter((b) => b.name.toLowerCase().includes(q)) : rows;
  }, [list.data, query]);

  // ბრენდების დაყოფა ორ სექციად:
  //   "active"   — isActive: true  → „აქტიური ბრენდები“ (ზემოთ)
  //   "inactive" — isActive: false → „გამორთული ბრენდები“ (ქვემოთ)
  // ბოლო .filter() ცარიელ სექციას აშორებს — თუ გამორთული არც ერთია,
  // „გამორთული ბრენდების“ სათაური საერთოდ არ გამოჩნდება.
  const groups = [
    { key: "active", title: t("catalog.brandsActive"), rows: visible.filter((b) => b.isActive) },
    { key: "inactive", title: t("catalog.brandsInactive"), rows: visible.filter((b) => !b.isActive) },
  ].filter((group) => group.rows.length > 0);

  return (
    <>
      {/* გვერდის თავი: სათაური, ტაბები (ნივთები / კატეგორიები / ბრენდები ...)
          და „ბრენდის დამატება“ ღილაკი, რომელიც ფორმას ხსნის */}
      <PageHeader
        title={t("inventory.title")}
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
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

        {/* ძებნის ველი — ჩნდება მხოლოდ მაშინ, როცა 8-ზე მეტი ბრენდია */}
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

        {/* Async თვითონ ირჩევს, რა აჩვენოს:
              skeleton — სანამ იტვირთება (ნაცრისფერი ყუთები)
              empty    — თუ ბრენდი ჯერ არ არის
              შეცდომა  — თუ სერვერი არ პასუხობს
              children — როცა სია მოვიდა */}
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
                  <Button size="sm" onClick={() => setAdding(true)}>
                    {t("catalog.brandAdd")}
                  </Button>
                }
              />
            </div>
          }
        >
          {() => (
            <div className="space-y-6">
              {groups.map((group) => (
                // ერთი სექცია: სათაური + ბრენდების ბადე
                <section key={group.key} className="space-y-3">
                  {/* სექციის სათაური: ფერადი წერტილი (ოქროსფერი = აქტიური,
                      წითელი = გამორთული), სახელი და რაოდენობა, მაგ. „აქტიური ბრენდები · 15“ */}
                  <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-faint">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        group.key === "active" ? "bg-brass" : "bg-danger"
                      )}
                    />
                    {group.title}
                    <span className="text-faint/70">· {group.rows.length}</span>
                  </h2>
                  {/* ბრენდების ბადე. სვეტების რაოდენობა ეკრანის სიგანეზეა
                      დამოკიდებული: ტელეფონზე 2, დიდ ეკრანზე 6.
                      დაჭერისას → ინვენტარის გვერდი ამ ბრენდის პროდუქტებით */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                    {group.rows.map((brand) => (
                      <BrandCard
                        key={brand.id}
                        brand={brand}
                        onOpen={() => router.push(`/inventory?brandId=${brand.id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Async>
      </main>

      {/* დამატების ფორმა. onSaved={list.reload} — შენახვის შემდეგ
          სია თავიდან მოდის სერვერიდან (ახალი GET) და ახალი ბრენდი ეგრევე ჩანს */}
      <BrandModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={list.reload}
      />
    </>
  );
}

/**
 * ერთი ბრენდის ბარათი.
 *   brand  — { id, name, isActive, logo, productCount? }
 *   onOpen — რა მოხდეს ბარათზე დაჭერისას
 * ცალკე კომპონენტია, რომ ორივე სექციამ (აქტიური / გამორთული) ერთი და იგივე
 * ბარათი გამოიყენოს და კოდი არ გამეორდეს.
 */
function BrandCard({ brand, onOpen }) {
  const { t } = useI18n();
  // ბარათი მკრთალია, თუ ბრენდი გამორთულია ან მას ნივთი არ აქვს
  const dim = !brand.isActive || brand.productCount === 0;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors",
        "hover:border-line-strong",
        dim && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col items-center gap-3 px-3 pb-3 pt-5"
      >
        {/* ლოგოს ყუთი — ყველა ლოგო ერთი ზომის ყუთშია, რომ ბადე სწორი იყოს.
            ლოგო თუ არ აქვს → სახელის პირველი ორი ასო (მაგ. Alta → „AL“) */}
        <span className="flex h-16 w-full items-center justify-center rounded bg-bg/70 px-3">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="" className="max-h-12 max-w-full object-contain" />
          ) : (
            <span className="text-lg font-semibold text-faint">
              {brand.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <span className="w-full text-center">
          <span className="block truncate text-[13px] text-fg">{brand.name}</span>
          {/* „N ნივთი“ — ჩანს მხოლოდ მაშინ, როცა API productCount-ს აბრუნებს
              (ახლა არ აბრუნებს, ამიტომ არ ჩანს) */}
          {brand.productCount != null && (
            <span className="mt-0.5 block text-[11px] text-faint">
              {t("catalog.productsCount", { n: brand.productCount })}
            </span>
          )}
        </span>
      </button>
    </article>
  );
}

/**
 * ახალი ბრენდის დამატების ფორმა (ფანჯარა).
 *   open    — ღიაა თუ არა
 *   onClose — ფანჯრის დახურვა
 *   onSaved — გამოიძახება წარმატებული შენახვის შემდეგ (გვერდზე ეს list.reload-ია)
 */
function BrandModal({ open, onClose, onSaved }) {
  const { t } = useI18n();
  const [name, setName] = useState(""); // ბრენდის სახელი (სავალდებულო)
  const [logo, setLogo] = useState(null); // ლოგო — სურათი base64 ტექსტად
  const [isActive, setIsActive] = useState(true); // აქტიურია თუ არა (თავიდან — კი)
  const [pending, setPending] = useState(false); // იგზავნება თუ არა ახლა
  const [error, setError] = useState(null); // შეცდომის ტექსტი ფორმის ქვემოთ

  // ფორმის ყოველ გახსნაზე ველები სუფთავდება
  useEffect(() => {
    if (!open) return;
    setName("");
    setLogo(null);
    setIsActive(true);
    setError(null);
  }, [open]);

  // „შენახვის“ დაჭერისას:
  async function submit(event) {
    event.preventDefault(); // ბრაუზერმა გვერდი არ გადატვირთოს
    if (!name.trim()) return; // ცარიელი სახელით არ ვაგზავნით
    setPending(true); // ღილაკი იბლოკება — ორჯერ რომ არ გაიგზავნოს
    setError(null);
    try {
      // 1) POST /api/v1/brands  { name, isActive }
      const brand = await brandsApi.create({ name: name.trim(), isActive, logo });
      // 2) სიის განახლება (ახალი GET) და ფანჯრის დახურვა
      onSaved(brand);
      onClose();
    } catch (err) {
      // შეცდომა ფორმაში ჩანს, ფანჯარა ღია რჩება.
      // "NETWORK" — სერვერი გამორთულია ან მიუწვდომელია → „კავშირი არ არის“
      // სხვა შემთხვევაში — სერვერის ტექსტი, მაგ. „Brand name is required.“
      setError(err.message === "NETWORK" ? t("state.offline") : err.message);
    } finally {
      setPending(false); // ღილაკი ისევ აქტიურდება
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={t("catalog.brandAdd")}
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
        {/* ლოგოს არჩევა (სურათის ატვირთვა) */}
        <ImagePicker
          label={t("catalog.logo")}
          value={logo}
          onChange={setLogo}
          className="w-[116px] shrink-0"
        />
        <div className="flex flex-1 flex-col gap-4">
          {/* სახელის ველი */}
          <Field label={t("catalog.brandName")} required>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("catalog.brandNamePlaceholder")}
            />
          </Field>
          {/* აქტიურია თუ არა — ჩექბოქსი. ტექსტი იცვლება: „აქტიური“ / „გამორთული“ */}
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-brass"
            />
            {isActive ? t("catalog.brandActive") : t("catalog.brandInactive")}
          </label>
        </div>
      </form>
    </Modal>
  );
}
