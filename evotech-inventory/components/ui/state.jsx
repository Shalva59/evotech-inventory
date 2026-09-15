"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A skeleton, not a spinner. The shape of the thing that is coming tells the
 * cashier what to expect; a spinner tells them only that something is slow.
 */
export function Skeleton({ className }) {
  return <div className={cn("animate-pulse-line rounded bg-elevated", className)} />;
}

export function SkeletonRows({ rows = 4, className }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

/**
 * The error a shop will actually hit is "the server is not running", so it
 * gets its own wording and a way back rather than a stack trace.
 */
export function ErrorState({ error, onRetry, compact }) {
  const t = useT();
  const isNetwork = error?.message === "NETWORK" || error?.status === 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "py-8" : "py-14"
      )}
    >
      <CloudOff className="h-5 w-5 text-danger" strokeWidth={1.6} />
      <div>
        <p className="text-sm text-fg">{isNetwork ? t("state.offline") : t("state.errorTitle")}</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-2xs leading-relaxed text-faint">
          {isNetwork ? t("state.offlineHint") : error?.message}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={1.8} />
          {t("state.retry")}
        </Button>
      )}
    </div>
  );
}

/** An empty screen is an invitation to act, so it always names the next step. */
export function EmptyState({ title, hint, action, icon: Icon, compact }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "py-8" : "py-14"
      )}
    >
      {Icon && <Icon className="h-5 w-5 text-faint" strokeWidth={1.5} />}
      <p className="text-sm text-muted">{title}</p>
      {hint && <p className="max-w-[44ch] text-2xs leading-relaxed text-faint">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * One wrapper that covers loading, failure and emptiness so no screen
 * forgets a case and renders `undefined.map`.
 */
export function Async({ query, isEmpty, empty, skeleton, children, compact }) {
  const { data, loading, error, reload } = query;

  if (loading) return skeleton ?? <SkeletonRows className="py-2" />;
  if (error) return <ErrorState error={error} onRetry={reload} compact={compact} />;
  if (isEmpty ? isEmpty(data) : !data) return empty ?? null;
  return children(data);
}
