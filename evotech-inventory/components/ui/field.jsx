"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------- Input ---------- */

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded border border-line bg-bg px-3 text-sm text-fg",
        "placeholder:text-faint transition-colors",
        "hover:border-line-strong focus:border-brass focus:outline-none",
        "disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
});

/* ---------- Select ---------- */

export const Select = React.forwardRef(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded border border-line bg-bg pl-3 pr-9 text-sm text-fg",
          "transition-colors hover:border-line-strong focus:border-brass focus:outline-none",
          "disabled:opacity-40 disabled:hover:border-line",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
});

/* ---------- Textarea ---------- */

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded border border-line bg-bg px-3 py-2 text-sm text-fg",
        "placeholder:text-faint transition-colors",
        "hover:border-line-strong focus:border-brass focus:outline-none",
        className
      )}
      {...props}
    />
  );
});

/* ---------- Field wrapper ---------- */

export function Field({ label, hint, required, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] text-muted">
        {label}
        {required && <span className="text-brass">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-2xs text-faint">{hint}</span>}
    </label>
  );
}

/* ---------- Toggle group (segmented control) ---------- */

export function ToggleGroup({ value, onChange, options, className, size = "md" }) {
  return (
    <div
      role="group"
      className={cn("inline-flex rounded border border-line bg-bg p-0.5", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm transition-colors",
              size === "sm" ? "h-7 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm",
              active ? "bg-brass text-brass-fg" : "text-muted hover:bg-elevated hover:text-fg"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Switch ---------- */

export function Switch({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {description && <span className="block text-2xs text-faint">{description}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-jade bg-jade/25" : "border-line bg-bg"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
            checked ? "left-[24px] bg-jade" : "left-[3px] bg-faint"
          )}
        />
      </span>
    </button>
  );
}

/* ---------- Checkbox ---------- */

export function Checkbox({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded border p-3 text-left transition-colors",
        checked ? "border-brass bg-brass-dim/40" : "border-line bg-bg hover:border-line-strong"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
          checked ? "border-brass bg-brass" : "border-line-strong"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-brass-fg" aria-hidden>
            <path
              d="M2.5 6.2l2.3 2.3 4.7-4.9"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        {description && (
          <span className="mt-0.5 block text-2xs leading-relaxed text-faint">{description}</span>
        )}
      </span>
    </button>
  );
}
