"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ScanLine, Boxes, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

// Five is the ceiling for a thumb-reachable bar. Expenses and attendance
// live under Settings-adjacent screens on phones; the till does not.
const NAV = [
  { href: "/", key: "dashboard", icon: LayoutGrid },
  { href: "/pos", key: "pos", icon: ScanLine },
  { href: "/inventory", key: "inventory", icon: Boxes },
  { href: "/employees", key: "employees", icon: Users },
  { href: "/settings", key: "settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface lg:hidden">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors",
              active ? "text-brass" : "text-faint"
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="max-w-full truncate px-1">{t(`nav.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
