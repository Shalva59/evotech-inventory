import { PageHeader } from "@/components/shell/PageHeader";
import { ProductForm } from "@/components/forms/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add product" subtitle="Inventory › New item" />
      <main className="flex-1 p-5 sm:p-6">
        <ProductForm />
      </main>
    </>
  );
}
