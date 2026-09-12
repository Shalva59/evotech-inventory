"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ScanLine,
  Boxes,
  Receipt,
  Users,
  Wrench,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/pos", label: "POS", icon: ScanLine },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/employees", label: "Employees", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[216px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-brass">
          <Wrench className="h-3.5 w-3.5 text-brass-fg" strokeWidth={2.5} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-fg">EVOTECH</span>
      </div>

      <nav className="flex-1 px-2.5 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative mb-0.5 flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-elevated text-fg"
                  : "text-muted hover:bg-elevated/60 hover:text-fg"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brass" />
              )}
              <Icon className={cn("h-4 w-4", active ? "text-brass" : "text-faint")} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-2.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated/60 hover:text-fg"
        >
          <Settings className="h-4 w-4 text-faint" strokeWidth={1.8} />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2.5 rounded bg-bg px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brass-dim text-2xs font-semibold text-brass">
            DB
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] text-fg">Data Beridze</span>
            <span className="block text-2xs text-faint">Admin</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
