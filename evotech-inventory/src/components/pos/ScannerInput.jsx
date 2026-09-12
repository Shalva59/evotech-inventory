"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hardware barcode scanners act as keyboards that type a code then press
 * Enter. Two things matter for a fast counter:
 *  1. The field keeps focus, so a scan never lands in the void.
 *  2. Enter submits and clears immediately, ready for the next scan.
 */
export function ScannerInput({ onSubmit, notFound }) {
  const [code, setCode] = useState("");
  const inputRef = useRef(null);

  // Reclaim focus whenever the cashier clicks elsewhere on the page.
  useEffect(() => {
    const el = inputRef.current;
    el?.focus();

    function handleGlobalKey(e) {
      const target = e.target;
      const typingElsewhere =
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA";
      if (!typingElsewhere && e.key.length === 1) el?.focus();
    }

    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  function submit() {
    const trimmed = code.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setCode("");
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 rounded border bg-bg px-4 transition-colors",
          notFound ? "border-danger" : "border-line focus-within:border-brass"
        )}
      >
        <ScanLine
          className={cn("h-5 w-5 shrink-0", notFound ? "text-danger" : "text-brass")}
          strokeWidth={1.8}
        />
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Scan barcode or type SKU / product name"
          aria-label="Barcode scanner input"
          autoComplete="off"
          className="h-14 flex-1 bg-transparent font-mono text-[15px] text-fg placeholder:font-sans placeholder:text-faint focus:outline-none"
        />
        <button
          onClick={submit}
          aria-label="Add item"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-faint transition-colors hover:bg-elevated hover:text-fg"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
      {notFound && (
        <p className="mt-2 font-mono text-2xs text-danger">
          No product matches “{notFound}”. Check the code or add it in Inventory.
        </p>
      )}
    </div>
  );
}
