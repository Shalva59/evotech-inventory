"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { useI18n } from "@/lib/i18n";

export default function NewEmployeePage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t("employees.newEmployee")} />
      <main className="p-5">
        <EmployeeForm />
      </main>
    </>
  );
}
