"use client";

import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { Select, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A dropdown with a "+" beside it. Pressing "+" swaps the dropdown for a
 * text field in the same spot; Enter creates the item and selects it.
 *
 * Deliberately inline rather than a second modal on top of the first — two
 * stacked dialogs is where people lose track of which "Cancel" does what.
 */
export function QuickAddSelect({
  label,
  required,
  value,
  onChange,
  options,
  onCreate,
  disabled,
  placeholder,
  hint,
}) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      const created = await onCreate(trimmed);
      onChange(created.id);
      setAdding(false);
      setName("");
    } catch (err) {
      setError(err.message || t("state.errorTitle"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] text-muted">
        {label}
        {required && <span className="text-brass">*</span>}
      </span>

      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          {adding ? (
            <Input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                // Enter here must not submit the whole product form.
                if (event.key === "Enter") {
                  event.preventDefault();
                  create();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setAdding(false);
                }
              }}
              placeholder={t("catalog.quickAddPlaceholder")}
              className={cn("border-brass", error && "border-danger")}
            />
          ) : (
            <Select
              value={value ?? ""}
              onChange={(event) => onChange(event.target.value || null)}
              disabled={disabled}
            >
              <option value="">{placeholder ?? "—"}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {onCreate && (
          <button
            type="button"
            onClick={() => (adding ? create() : setAdding(true))}
            disabled={disabled || pending}
            title={t("catalog.quickAdd")}
            aria-label={t("catalog.quickAdd")}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-40",
              adding
                ? "border-brass bg-brass text-brass-fg hover:bg-brass-hi"
                : "border-line text-muted hover:border-brass hover:text-brass"
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        )}

        {adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError(null);
            }}
            className="flex h-10 w-8 shrink-0 items-center justify-center rounded text-faint transition-colors hover:text-fg"
            aria-label={t("state.cancel")}
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {(error || hint) && (
        <p className={cn("mt-1.5 text-[11px]", error ? "text-danger" : "text-faint")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
