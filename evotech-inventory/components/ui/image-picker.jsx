"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { resizeImage } from "@/lib/image";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Square drop-zone that resizes on the way in and hands back a data URL. */
export function ImagePicker({ value, onChange, label, className, rounded }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function handle(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      onChange(await resizeImage(file));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <span className="block text-[13px] text-muted">{label}</span>}
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handle(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden border transition-colors",
          rounded ? "rounded-full" : "rounded",
          value ? "border-line bg-bg" : "border-dashed border-line-strong bg-bg hover:border-brass"
        )}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-faint" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-2 text-center">
            <ImagePlus className="h-5 w-5 text-faint" strokeWidth={1.6} />
            <span className="text-[11px] text-muted">{t("catalog.imageUpload")}</span>
            <span className="text-[10px] text-faint">{t("catalog.imageHint")}</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            handle(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-danger"
        >
          <X className="h-3 w-3" strokeWidth={2} />
          {t("catalog.imageRemove")}
        </button>
      )}
    </div>
  );
}

/** Small round/square thumbnail with a monogram fallback. */
export function Thumb({ src, name, size = 36, rounded, className }) {
  const letters = (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-line bg-bg",
        rounded ? "rounded-full" : "rounded",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
      ) : (
        <span className="text-[10px] font-semibold text-faint">{letters}</span>
      )}
    </span>
  );
}
