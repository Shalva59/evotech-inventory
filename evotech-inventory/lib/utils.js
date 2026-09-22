import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Store currency. Change once here and every screen follows. */
export const CURRENCY = "GEL";
export const CURRENCY_SYMBOL = "₾";

export function money(amount, opts) {
  const decimals = opts?.decimals ?? true;
  return (
    CURRENCY_SYMBOL +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    })
  );
}

export function compactMoney(amount) {
  if (Math.abs(amount) >= 1000) {
    return CURRENCY_SYMBOL + (amount / 1000).toFixed(1) + "k";
  }
  return money(amount, { decimals: false });
}

export function timeAgo(iso, now = new Date()) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
