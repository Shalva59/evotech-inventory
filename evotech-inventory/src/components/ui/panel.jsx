import { cn } from "@/lib/utils";

/**
 * A bordered surface. Depth is communicated with a hairline and a small
 * background lift — deliberately no drop shadows, which read as noise on a
 * dark UI and make dense screens feel soft.
 */
export function Panel({ className, children, flush }) {
  return (
    <section className={cn("rounded border border-line bg-surface", !flush && "p-5", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, meta, action, className }) {
  return (
    <header className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {meta && <div className="mt-0.5 text-2xs text-faint">{meta}</div>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-14 text-center">
      <p className="text-sm text-muted">{title}</p>
      {hint && <p className="text-2xs text-faint">{hint}</p>}
    </div>
  );
}
