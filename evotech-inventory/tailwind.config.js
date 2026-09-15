/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — slate-blue black, lifted in small steps
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        line: "hsl(var(--line))",
        "line-strong": "hsl(var(--line-strong))",

        // Text
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        faint: "hsl(var(--faint))",

        // Brand — brass. Solder, contacts, screwdriver bits.
        brass: {
          DEFAULT: "hsl(var(--brass))",
          hi: "hsl(var(--brass-hi))",
          dim: "hsl(var(--brass-dim))",
          fg: "hsl(var(--brass-fg))",
        },

        // Semantics — jade confirms, red is reserved for genuine stop-work
        jade: { DEFAULT: "hsl(var(--jade))", dim: "hsl(var(--jade-dim))" },
        danger: { DEFAULT: "hsl(var(--danger))", dim: "hsl(var(--danger-dim))" },
        info: { DEFAULT: "hsl(var(--info))", dim: "hsl(var(--info-dim))" },
      },
      fontFamily: {
        // Latin glyphs resolve to Archivo; Georgian ones fall through to Noto,
        // so a bilingual label like "POS / სალარო" stays visually consistent.
        sans: [
          "var(--font-archivo)",
          "var(--font-georgian)",
          "system-ui",
          "sans-serif",
        ],
        georgian: ["var(--font-georgian)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
      },
      keyframes: {
        "pulse-line": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "pulse-line": "pulse-line 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
