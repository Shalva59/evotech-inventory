"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A dialog that only closes when told to.
 *
 * `dismissable={false}` — the default — ignores backdrop clicks and Escape.
 * Someone halfway through typing a product in should not lose it to a stray
 * click beside the window. Small confirm dialogs pass `dismissable` to allow
 * both.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  dismissable = false,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKey(event) {
      if (event.key === "Escape" && dismissable) onClose?.();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, dismissable, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widths = {
    sm: "max-w-[420px]",
    md: "max-w-[560px]",
    lg: "max-w-[880px]",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-bg/75 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (dismissable && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden border border-line-strong bg-surface",
          "rounded-t-lg sm:rounded animate-modal-in",
          widths[size]
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium text-fg">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-2xs text-faint">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-faint transition-colors hover:bg-elevated hover:text-fg"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-bg/40 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Small yes/no, used for deletions. Escape and backdrop both cancel. */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissable
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded px-4 text-[13px] text-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-9 rounded px-4 text-[13px] font-medium transition-colors",
              danger ? "bg-danger text-bg hover:brightness-110" : "bg-brass text-brass-fg hover:bg-brass-hi"
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="px-5 py-4 text-sm leading-relaxed text-muted">{message}</p>
    </Modal>
  );
}
