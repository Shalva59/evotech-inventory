import { CURRENCY_SYMBOL, amount as formatAmount, cn } from "@/lib/utils";

/**
 * A price. The digits are monospaced so columns of them line up; the lari
 * mark is not, because the mono face has no glyph for it and the fallback
 * arrives at a different weight.
 */
export function Money({ value, decimals = true, className }) {
  return (
    <span className={cn("tnum whitespace-nowrap font-mono", className)}>
      <span className="cur">{CURRENCY_SYMBOL}</span>
      {formatAmount(value, { decimals })}
    </span>
  );
}
