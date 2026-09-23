"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inventory", key: "items", exact: true },
  { href: "/inventory/categories", key: "categories" },
  { href: "/inventory/brands", key: "brands" },
  { href: "/inventory/devices", key: "devices" },
  { href: "/inventory/suppliers", key: "suppliers" },
];

/** The five catalogue screens read as one section with tabs, not five pages. */
export function CatalogNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex gap-1 overflow-x-auto px-5">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative whitespace-nowrap px-3 pb-3 pt-1 text-[13px] transition-colors",
              active ? "text-fg" : "text-faint hover:text-muted"
            )}
          >
            {t(`catalog.${tab.key}`)}
            {active && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-brass" />}
          </Link>
        );
      })}
    </nav>
  );
}
