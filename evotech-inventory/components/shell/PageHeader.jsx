"use client";

import { cn } from "@/lib/utils";

/**
 * Sticky so the period filter never scrolls away — on a long expense list
 * the question "which month am I looking at" has to stay answered.
 */
export function PageHeader({ title, subtitle, actions, className, children }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:h-14 lg:flex-nowrap lg:py-0">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-medium text-fg">{title}</h1>
          {subtitle && <p className="truncate text-2xs text-faint">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
