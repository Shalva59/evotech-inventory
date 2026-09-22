"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ScanLine,
  Boxes,
  Receipt,
  Users,
  Clock3,
  Wrench,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth, initials } from "@/lib/auth";

const NAV = [
  { href: "/", key: "dashboard", icon: LayoutGrid },
  { href: "/pos", key: "pos", icon: ScanLine },
  { href: "/inventory", key: "inventory", icon: Boxes },
  { href: "/expenses", key: "expenses", icon: Receipt },
  { href: "/employees", key: "employees", icon: Users },
  { href: "/attendance", key: "attendance", icon: Clock3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();

  const roleLabel = user?.roles?.length ? t(`employees.${user.roles[0]}`) : "";

  return (
    <aside className="hidden w-[216px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-brass">
          <Wrench className="h-3.5 w-3.5 text-brass-fg" strokeWidth={2.5} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-fg">EVOTECH</span>
      </div>

      <nav className="flex-1 px-2.5 py-4">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative mb-0.5 flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brass" />
              )}
              <Icon
                className={cn("h-4 w-4 shrink-0", active ? "text-brass" : "text-faint")}
                strokeWidth={1.8}
              />
              <span className="truncate">{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-2.5">
        <div className="mb-2 flex gap-0.5 rounded border border-line bg-bg p-0.5">
          {[
            { id: "ka", label: "ქარ" },
            { id: "en", label: "ENG" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLang(option.id)}
              className={cn(
                "h-6 flex-1 rounded-sm text-2xs transition-colors",
                lang === option.id ? "bg-elevated text-fg" : "text-faint hover:text-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated/60 hover:text-fg"
        >
          <Settings className="h-4 w-4 text-faint" strokeWidth={1.8} />
          {t("nav.settings")}
        </Link>

        <div className="mt-2 flex items-center gap-2.5 rounded bg-bg px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass-dim text-2xs font-semibold text-brass">
            {initials(user?.fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] text-fg">{user?.fullName}</span>
            <span className="block truncate text-2xs text-faint">{roleLabel}</span>
          </span>
          <button
            type="button"
            onClick={signOut}
            title={t("nav.signOut")}
            aria-label={t("nav.signOut")}
            className="shrink-0 text-faint transition-colors hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}
