import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EMPLOYEES } from "@/lib/mock-data";
import { ROLE_META } from "@/lib/types";
import { money } from "@/lib/utils";

export default function EmployeesPage() {
  const activeCount = EMPLOYEES.filter((e) => e.active).length;

  return (
    <>
      <PageHeader title="Employees" subtitle={`${activeCount} active of ${EMPLOYEES.length}`}>
        <Link href="/employees/new">
          <Button size="sm">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add employee
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 p-5 sm:p-6">
        <Panel flush>
          <ul className="divide-y divide-line">
            {EMPLOYEES.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-elevated/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-dim text-2xs font-semibold text-brass">
                  {e.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>

                <div className="min-w-[180px] flex-1">
                  <p className="flex items-center gap-2 text-[13px] text-fg">
                    {e.fullName}
                    {!e.active && (
                      <span className="rounded-sm bg-bg px-1.5 py-0.5 text-2xs text-faint">
                        inactive
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-2xs text-faint">{e.phone}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {e.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-sm border border-line px-2 py-0.5 text-2xs text-muted"
                    >
                      {ROLE_META[r].label}
                    </span>
                  ))}
                </div>

                <span className="w-20 text-2xs text-muted">
                  {e.shift === "morning" ? "Morning" : "Evening"}
                </span>

                <span className="w-28 text-right font-mono text-2xs text-muted tnum">
                  {e.salaryModel === "fixed"
                    ? `${money(e.salaryAmount ?? 0, { decimals: false })}/mo`
                    : `${e.commissionRate}% comm.`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </main>
    </>
  );
}
