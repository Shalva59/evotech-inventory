"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ScanLine, Boxes, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dash", icon: LayoutGrid },
  { href: "/pos", label: "POS", icon: ScanLine },
  { href: "/inventory", label: "Stock", icon: Boxes },
  { href: "/expenses", label: "Spend", icon: Receipt },
  { href: "/employees", label: "Team", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface lg:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-2xs transition-colors",
              active ? "text-fg" : "text-faint"
            )}
          >
            {active && <span className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-brass" />}
            <Icon className={cn("h-[18px] w-[18px]", active && "text-brass")} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
