"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Switch, ToggleGroup } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ROLE_META } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES = Object.keys(ROLE_META);

export function EmployeeForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [active, setActive] = useState(true);
  const [roles, setRoles] = useState(["cashier"]);
  const [shift, setShift] = useState("morning");
  const [salaryModel, setSalaryModel] = useState("fixed");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  const pinRefs = useRef([]);

  function setPinDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) pinRefs.current[index + 1]?.focus();
  }

  function handlePinKey(index, e) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  function toggleRole(role) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // POST /api/employees — the PIN is hashed server-side before storage.
      }}
      className="grid grid-cols-1 gap-4 xl:grid-cols-3"
    >
      <div className="space-y-4 xl:col-span-2">
        {/* Personal info */}
        <Panel>
          <PanelHeader title="Personal information" meta="Used on receipts and shift reports" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nino Kapanadze"
              />
            </Field>
            <Field label="Phone number" required>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+995 5XX XX XX XX"
                className="font-mono"
              />
            </Field>
          </div>

          {/* PIN — four separate boxes, because that's how it will be typed
              on the POS terminal every single shift. */}
          <div className="mt-5 border-t border-line pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-muted">
                POS login PIN <span className="text-brass">*</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-fg"
              >
                {showPin ? (
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                )}
                {showPin ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-2.5 flex gap-2">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    pinRefs.current[i] = el;
                  }}
                  value={digit}
                  onChange={(e) => setPinDigit(i, e.target.value)}
                  onKeyDown={(e) => handlePinKey(i, e)}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`PIN digit ${i + 1}`}
                  className={cn(
                    "h-14 w-14 rounded border bg-bg text-center font-mono text-xl text-fg transition-colors",
                    digit ? "border-brass" : "border-line hover:border-line-strong",
                    "focus:border-brass focus:outline-none"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-2xs text-faint">
              Four digits, entered at the terminal instead of a password. Stored hashed — no one,
              including admins, can read it back.
            </p>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <Switch
              checked={active}
              onChange={setActive}
              label={active ? "Active" : "Inactive"}
              description={
                active
                  ? "Can sign in to the POS and appear in shift reports"
                  : "Sign-in blocked — past sales records are kept"
              }
            />
          </div>
        </Panel>

        {/* Roles */}
        <Panel>
          <PanelHeader
            title="Roles and permissions"
            meta="Pick every role this person performs — permissions combine"
            action={
              <span className="flex items-center gap-1.5 text-2xs text-faint">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                {roles.length} selected
              </span>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROLES.map((role) => (
              <Checkbox
                key={role}
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
                label={ROLE_META[role].label}
                description={ROLE_META[role].scope}
              />
            ))}
          </div>
          {roles.includes("admin") && (
            <p className="mt-3 rounded border border-brass/40 bg-brass-dim/40 px-3 py-2.5 text-2xs text-brass">
              Admin sees cost prices, profit margins, and payroll. Grant it sparingly.
            </p>
          )}
          {roles.length === 0 && (
            <p className="mt-3 text-2xs text-danger">
              Pick at least one role, or this person cannot sign in at all.
            </p>
          )}
        </Panel>
      </div>

      {/* Work details */}
      <div className="space-y-4">
        <Panel className="xl:sticky xl:top-[72px]">
          <PanelHeader title="Work details" meta="Drives scheduling and payroll" />

          <div className="mt-4 space-y-5">
            <div>
              <span className="mb-2 block text-[13px] text-muted">Shift</span>
              <ToggleGroup
                value={shift}
                onChange={setShift}
                options={[
                  { value: "morning", label: "Morning" },
                  { value: "evening", label: "Evening" },
                ]}
                className="w-full"
              />
              <p className="mt-1.5 text-2xs text-faint">
                {shift === "morning" ? "10:00 – 16:00" : "16:00 – 22:00"}
              </p>
            </div>

            <div>
              <span className="mb-2 block text-[13px] text-muted">Salary model</span>
              <ToggleGroup
                value={salaryModel}
                onChange={setSalaryModel}
                options={[
                  { value: "fixed", label: "Fixed" },
                  { value: "commission", label: "Commission" },
                ]}
                className="w-full"
              />
            </div>

            {salaryModel === "fixed" ? (
              <Field label="Monthly salary" hint="Posted to Fixed expenses automatically">
                <Input
                  type="number"
                  min={0}
                  value={salaryAmount}
                  onChange={(e) =>
                    setSalaryAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                  className="font-mono tnum"
                />
              </Field>
            ) : (
              <Field label="Commission rate" hint="Percentage of each sale this person closes">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(e) =>
                      setCommissionRate(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="4"
                    className="pr-8 font-mono tnum"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">
                    %
                  </span>
                </div>
              </Field>
            )}
          </div>

          <div className="mt-5 flex gap-2 border-t border-line pt-5">
            <Button type="submit" variant="primary" className="flex-1" disabled={roles.length === 0}>
              Create employee
            </Button>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </Panel>
      </div>
    </form>
  );
}
