"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, Loader2 } from "lucide-react";
import { products } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Hardware barcode scanners are keyboards: they type the code and press
 * Enter. If the caret happens to be in the discount box, the scan lands
 * there instead — the single most common way a till goes wrong. So this
 * field takes focus back whenever the cashier types anywhere that is not
 * another input.
 */
export function ScannerInput({ onAdd, disabled }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function reclaim(event) {
      const target = event.target;
      const typingElsewhere =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typingElsewhere) return;
      if (event.key.length !== 1 && event.key !== "Enter") return;
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", reclaim);
    return () => window.removeEventListener("keydown", reclaim);
  }, []);

  async function submit(event) {
    event.preventDefault();
    const query = code.trim();
    if (!query || pending) return;

    setPending(true);
    setError(null);
    try {
      const product = await products.lookup(query);
      if (!product) {
        setError(t("pos.notFound"));
        return;
      }
      onAdd(product);
      setCode("");
    } catch (err) {
      setError(err.status === 404 ? t("pos.notFound") : t("state.errorTitle"));
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <form onSubmit={submit} className="relative">
      <ScanLine
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2",
          error ? "text-danger" : "text-brass"
        )}
        strokeWidth={1.8}
      />
      <input
        ref={inputRef}
        value={code}
        disabled={disabled}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setCode(event.target.value);
          if (error) setError(null);
        }}
        placeholder={t("pos.scanPrompt")}
        className={cn(
          "h-14 w-full rounded border bg-surface pl-12 pr-12 font-mono text-[15px] text-fg",
          "placeholder:font-sans placeholder:text-faint transition-colors",
          "focus:outline-none",
          error ? "border-danger" : "border-line focus:border-brass"
        )}
      />
      {pending && (
        <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-faint" />
      )}
      <p className={cn("mt-1.5 h-4 px-1 text-2xs", error ? "text-danger" : "text-faint")}>
        {error || t("pos.scanHint")}
      </p>
    </form>
  );
}
