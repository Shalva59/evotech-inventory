"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { ProductForm } from "@/components/forms/ProductForm";
import { useI18n } from "@/lib/i18n";

export default function NewProductPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t("inventory.newProduct")} />
      <main className="p-5">
        <ProductForm />
      </main>
    </>
  );
}
