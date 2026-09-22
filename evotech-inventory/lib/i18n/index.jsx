"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ka } from "./ka";
import { en } from "./en";

const DICTS = { ka, en };
const STORAGE_KEY = "evotech.lang";
export const DEFAULT_LANG = "ka";

const I18nContext = createContext(null);

/**
 * Language lives on the device, not on the account — a shared till and the
 * owner's laptop can sit on different languages without fighting each other.
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && DICTS[stored]) setLangState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    // Georgian has no uppercase, so any letter-spaced small-caps treatment
    // that works in English turns into noise. The class lets CSS opt out.
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!DICTS[next]) return;
    window.localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo(() => {
    const dict = DICTS[lang];

    /** t("pos.checkout") — dotted path, falls back to the key if missing. */
    function t(path, vars) {
      const parts = path.split(".");
      let node = dict;
      for (const part of parts) {
        node = node?.[part];
        if (node === undefined) return path;
      }
      if (typeof node !== "string" || !vars) return node;
      return node.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
    }

    return { lang, setLang, t, dict, ready };
  }, [lang, setLang, ready]);

  // Nothing renders until the stored language is known.
  //
  // The server has no localStorage, so it always renders Georgian and its own
  // clock. If the browser then picks English — or is simply a second later —
  // React finds different text where it expected a match and throws a
  // hydration error. Waiting one tick costs a frame and removes the entire
  // class of bug, which matters here because *every* string is translated.
  if (!ready) {
    return <div className="min-h-screen bg-bg" aria-hidden />;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Shorthand for the common case. */
export function useT() {
  return useI18n().t;
}

/** Relative time, translated. */
export function useTimeAgo() {
  const t = useT();
  return useCallback(
    (iso, now = new Date()) => {
      const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return t("time.justNow");
      if (diff < 3600) return t("time.minutesAgo", { n: Math.floor(diff / 60) });
      if (diff < 86400) return t("time.hoursAgo", { n: Math.floor(diff / 3600) });
      return t("time.daysAgo", { n: Math.floor(diff / 86400) });
    },
    [t]
  );
}
