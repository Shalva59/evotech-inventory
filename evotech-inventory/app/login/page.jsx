"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Delete, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { clockTime, formatDuration } from "@/lib/dates";

const PIN_LENGTH = 4;

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [greeting, setGreeting] = useState(null);

  const submit = useCallback(
    async (code) => {
      setPending(true);
      setError(null);
      try {
        const result = await signIn(code);
        // The backend has just written the attendance row and pinged
        // Telegram. Showing the time back confirms both happened.
        setGreeting(result);
      } catch (err) {
        setError(err.status === 403 ? t("login.inactive") : t("login.wrongPin"));
        setPin("");
      } finally {
        setPending(false);
      }
    },
    [signIn, t]
  );

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !pending) submit(pin);
  }, [pin, pending, submit]);

  // A cashier with a numpad keyboard should never have to reach for the mouse.
  useEffect(() => {
    function onKey(event) {
      if (greeting) return;
      if (/^[0-9]$/.test(event.key)) {
        setPin((p) => (p.length < PIN_LENGTH ? p + event.key : p));
      } else if (event.key === "Backspace") {
        setPin((p) => p.slice(0, -1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [greeting]);

  if (greeting) {
    return <ClockedIn greeting={greeting} onContinue={() => router.replace("/")} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brass">
          <Wrench className="h-4 w-4 text-brass-fg" strokeWidth={2.5} />
        </span>
        <span className="text-lg font-semibold tracking-tight">EVOTECH</span>
      </div>

      <h1 className="text-[15px] text-fg">{t("login.title")}</h1>
      <p className="mt-1 text-2xs text-faint">{t("login.subtitle")}</p>

      <div className="mt-7 flex gap-3" aria-live="polite">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-12 w-11 rounded border transition-colors",
              "flex items-center justify-center",
              error
                ? "border-danger"
                : i < pin.length
                  ? "border-brass bg-brass-dim/40"
                  : "border-line bg-surface"
            )}
          >
            {i < pin.length && <span className="h-2 w-2 rounded-full bg-brass" />}
          </span>
        ))}
      </div>

      <p className={cn("mt-3 h-4 text-2xs", error ? "text-danger" : "text-faint")}>
        {error || (pending ? t("login.signingIn") : "")}
      </p>

      <div className="mt-5 grid w-[224px] grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <Key key={digit} onClick={() => setPin((p) => (p.length < PIN_LENGTH ? p + digit : p))}>
            {digit}
          </Key>
        ))}
        <Key onClick={() => setPin("")} muted>
          {t("login.clear")}
        </Key>
        <Key onClick={() => setPin((p) => (p.length < PIN_LENGTH ? p + "0" : p))}>0</Key>
        <Key onClick={() => setPin((p) => p.slice(0, -1))} muted aria-label="Backspace">
          <Delete className="h-4 w-4" strokeWidth={1.8} />
        </Key>
      </div>

      <div className="mt-10 flex gap-1 rounded border border-line bg-bg p-0.5">
        {[
          { id: "ka", label: "ქართული" },
          { id: "en", label: "English" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setLang(option.id)}
            className={cn(
              "h-7 rounded-sm px-3 text-2xs transition-colors",
              lang === option.id ? "bg-elevated text-fg" : "text-faint hover:text-muted"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </main>
  );
}

function Key({ children, onClick, muted, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tnum flex h-14 items-center justify-center rounded border text-lg transition-colors",
        muted
          ? "border-line bg-transparent text-2xs text-muted hover:bg-elevated hover:text-fg"
          : "border-line bg-surface text-fg hover:border-brass hover:bg-elevated"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * The moment that matters for attendance: the employee sees exactly what was
 * recorded, so there is no argument later about what the system "decided".
 */
function ClockedIn({ greeting, onContinue }) {
  const { t } = useI18n();
  const late = greeting.clockIn?.lateMinutes ?? 0;
  const onTime = late <= 0;

  useEffect(() => {
    const id = setTimeout(onContinue, 2600);
    return () => clearTimeout(id);
  }, [onContinue]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-2xs text-faint">{t("login.welcome")}</p>
      <h1 className="mt-1 text-xl text-fg">{greeting.user.fullName}</h1>

      <div className="mt-7 w-full max-w-[300px] rounded border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <p className="text-2xs text-faint">{t("login.clockedInAt")}</p>
          <p className="tnum mt-1 font-mono text-3xl text-fg">
            {clockTime(greeting.clockIn?.at)}
          </p>
        </div>
        <div
          className={cn(
            "px-5 py-3 text-[13px]",
            onTime ? "text-jade" : "text-danger"
          )}
        >
          {onTime
            ? late < 0
              ? `${t("login.earlyBy")} ${formatDuration(Math.abs(late))}`
              : t("login.onTime")
            : `${t("login.lateBy")} ${formatDuration(late)}`}
        </div>
      </div>

      <Button className="mt-6" onClick={onContinue}>
        {t("login.continue")}
      </Button>
    </main>
  );
}
