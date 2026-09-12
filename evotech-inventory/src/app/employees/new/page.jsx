import { PageHeader } from "@/components/shell/PageHeader";
import { EmployeeForm } from "@/components/forms/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader title="Add employee" subtitle="Employees › New user" />
      <main className="flex-1 p-5 sm:p-6">
        <EmployeeForm />
      </main>
    </>
  );
}
