"use client";
import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Zap,
  Users,
  ClipboardList,
  Lightbulb,
  Settings,
  Download,
  ChevronDown,
  Info,
  Triangle,
} from "lucide-react";

/* ---------------------------------- data --------------------------------- */

const NAV = [
  { id: "reports", label: "Reports", icon: TrendingUp },
  { id: "library", label: "Library", icon: Zap },
  { id: "people", label: "People", icon: Users },
  { id: "activities", label: "Activities", icon: ClipboardList },
];

const SUPPORT = [
  { id: "start", label: "Get Started", icon: Lightbulb },
  { id: "settings", label: "Settings", icon: Settings },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const MONTH_VALUES = [95, 150, 140, 235, 275, 215, 240, 120, 280, 330, 360, 390];
const QUARTER_VALUES = [128, 242, 213, 360];

const WEAKEST = [
  { name: "Food Safety", score: 74, tone: "from-orange-400 to-rose-500", thumb: "from-amber-200 to-orange-400" },
  { name: "Compliance Basics Procedures", score: 52, tone: "from-orange-400 to-rose-500", thumb: "from-emerald-200 to-teal-400" },
  { name: "Company Networking", score: 36, tone: "from-orange-400 to-rose-500", thumb: "from-fuchsia-300 to-indigo-500" },
];

const STRONGEST = [
  { name: "Covid Protocols", score: 95, tone: "from-emerald-400 to-green-500", thumb: "from-sky-300 to-blue-500" },
  { name: "Cyber Security Basics", score: 92, tone: "from-emerald-400 to-green-500", thumb: "from-slate-400 to-slate-700" },
  { name: "Social Media Policies", score: 89, tone: "from-emerald-400 to-green-500", thumb: "from-lime-200 to-emerald-500" },
];

const USERS = [
  { name: "Jesse Thomas", meta: "637 Points · 98% Correct", rank: 1, up: true, hue: "bg-rose-400" },
  { name: "Thisal Mathiyazhagan", meta: "637 Points · 89% Correct", rank: 2, up: false, hue: "bg-amber-400" },
  { name: "Helena Lindberg", meta: "637 Points · 84% Correct", rank: 3, up: true, hue: "bg-sky-400" },
  { name: "Ann Poulsen", meta: "637 Points · 81% Correct", rank: 4, up: false, hue: "bg-violet-400" },
];

const GROUPS = [
  { name: "Houston Facility", meta: "52 Points / User · 97% Correct", rank: 1, up: true },
  { name: "Test Group", meta: "52 Points / User · 95% Correct", rank: 2, up: false },
  { name: "Sales Team", meta: "52 Points / User · 89% Correct", rank: 3, up: true },
  { name: "Support Crew", meta: "52 Points / User · 85% Correct", rank: 4, up: false },
];

const FILTERS = {
  timeframe: ["All-time", "Last 30 days", "Last 7 days", "Today"],
  people: ["All", "Managers", "New hires", "Contractors"],
  topic: ["All", "Safety", "Security", "Compliance"],
};

/* -------------------------------- primitives ------------------------------ */

function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200/70 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 h-11 text-sm text-left hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <span className="truncate text-gray-500">
          {label}: <span className="font-semibold text-gray-900">{value}</span>
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o}
              onMouseDown={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                o === value ? "text-blue-600 font-medium" : "text-gray-700"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sparkline({ seed }) {
  const points = useMemo(() => {
    const n = 26;
    let v = 50;
    return Array.from({ length: n }, (_, i) => {
      v += Math.sin((i + seed) * 1.7) * 9 + Math.cos((i + seed) * 0.6) * 5;
      v = Math.max(18, Math.min(82, v));
      return [(i / (n - 1)) * 100, 100 - v];
    });
  }, [seed]);

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <polygon points={area} fill="rgba(59,130,246,0.10)" />
      <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ProgressRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-9 h-9 rounded-md shrink-0 bg-gradient-to-br ${item.thumb}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">{item.name}</p>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${item.tone}`}
            style={{ width: `${item.score}%` }}
          />
        </div>
      </div>
      <p className="text-[13px] shrink-0 w-24 text-right">
        <span className="font-semibold text-gray-900">{item.score}%</span>{" "}
        <span className="text-gray-400">Correct</span>
      </p>
    </div>
  );
}

function RankBadge({ rank, up }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-sm font-medium text-gray-700">{rank}</span>
      <Triangle
        className={`w-2.5 h-2.5 ${up ? "text-emerald-500" : "text-red-500 rotate-180"}`}
        fill="currentColor"
        strokeWidth={0}
      />
    </div>
  );
}

/* ------------------------------- chart ------------------------------------ */

function ActivityChart({ range }) {
  const labels = range === "Month" ? MONTHS : QUARTERS;
  const values = range === "Month" ? MONTH_VALUES : QUARTER_VALUES;
  const max = 400;
  const ticks = [400, 300, 200, 100, 0];

  return (
    <div className="flex gap-3 h-full min-h-[220px]">
      <div className="flex flex-col justify-between text-[10px] text-gray-400 py-1 shrink-0">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="flex-1 flex items-end gap-1.5">
        {values.map((v, i) => (
          <div key={labels[i]} className="flex-1 flex flex-col items-center gap-2 h-full group">
            <div className="relative w-full flex-1 flex justify-center">
              <div className="absolute inset-y-0 w-2.5 rounded-full bg-blue-50" />
              <div
                className="absolute bottom-0 w-2.5 rounded-full bg-blue-600 transition-all duration-500"
                style={{ height: `${(v / max) * 100}%` }}
                title={`${labels[i]}: ${v}`}
              />
            </div>
            <span className="text-[9px] text-gray-400">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- placeholder ------------------------------ */

function Placeholder({ label }) {
  return (
    <Card className="p-10 text-center">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-500">
        Nothing here yet. Head to Reports to see live training data.
      </p>
    </Card>
  );
}

/* --------------------------------- app ------------------------------------ */

export default function Dashboard() {
  const [page, setPage] = useState("reports");
  const [timeframe, setTimeframe] = useState("All-time");
  const [people, setPeople] = useState("All");
  const [topic, setTopic] = useState("All");
  const [range, setRange] = useState("Month");
  const [rangeOpen, setRangeOpen] = useState(false);

  const activeLabel =
    [...NAV, ...SUPPORT].find((n) => n.id === page)?.label ?? "Reports";

  function downloadReport() {
    const rows = [
      ["Metric", "Value"],
      ["Timeframe", timeframe],
      ["People", people],
      ["Topic", topic],
      ["Active users", "27 of 80"],
      ["Questions answered", "3298"],
      ["Average session length", "2m 34s"],
      ["Starting knowledge", "64%"],
      ["Current knowledge", "86%"],
      ["Knowledge gain", "+34%"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 sm:p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(16,24,40,0.25)] flex flex-col lg:flex-row">
        {/* sidebar */}
        <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 lg:p-5">
          <div className="px-2 py-3 mb-4">
            <span className="text-[15px] font-semibold tracking-[0.35em] text-red-600">
              NOVARA
            </span>
          </div>

          <nav className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`} />
                  {label}
                </button>
              );
            })}
          </nav>

          <p className="mt-7 mb-2 px-3 text-[13px] text-gray-400">Support</p>
          <nav className="space-y-0.5">
            {SUPPORT.map(({ id, label, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`} />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* main */}
        <main className="flex-1 min-w-0 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{activeLabel}</h1>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="mt-4 h-px bg-gray-100" />

          {page !== "reports" ? (
            <div className="mt-6">
              <Placeholder label={activeLabel} />
            </div>
          ) : (
            <>
              {/* filters */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Select label="Timeframe" value={timeframe} options={FILTERS.timeframe} onChange={setTimeframe} />
                <Select label="People" value={people} options={FILTERS.people} onChange={setPeople} />
                <Select label="Topic" value={topic} options={FILTERS.topic} onChange={setTopic} />
              </div>

              {/* stats + activity */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="p-4">
                    <p className="text-xs text-gray-500">Active Users</p>
                    <p className="mt-4 text-2xl font-bold">
                      27<span className="text-base font-medium text-gray-400">/80</span>
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-gray-500">Questions Answered</p>
                    <p className="mt-4 text-2xl font-bold">3,298</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-gray-500">Av. Session Length</p>
                    <p className="mt-4 text-2xl font-bold">2m 34s</p>
                  </Card>

                  <Card className="p-4 flex flex-col">
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      Starting Knowledge <Info className="w-3 h-3 text-gray-400" />
                    </p>
                    <p className="mt-3 text-2xl font-bold">64%</p>
                    <div className="mt-auto pt-3">
                      <Sparkline seed={1} />
                    </div>
                  </Card>
                  <Card className="p-4 flex flex-col">
                    <p className="text-xs text-gray-500">Current Knowledge</p>
                    <p className="mt-3 text-2xl font-bold">86%</p>
                    <div className="mt-auto pt-3">
                      <Sparkline seed={4} />
                    </div>
                  </Card>
                  <Card className="p-4 flex flex-col">
                    <p className="text-xs text-gray-500">Knowledge Gain</p>
                    <p className="mt-3 text-2xl font-bold">+34%</p>
                    <div className="mt-auto pt-3">
                      <Sparkline seed={7} />
                    </div>
                  </Card>
                </div>

                <Card className="p-5 flex flex-col">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-500">Activity</p>
                    <div className="relative">
                      <button
                        onClick={() => setRangeOpen((o) => !o)}
                        onBlur={() => setTimeout(() => setRangeOpen(false), 120)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600"
                      >
                        {range}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {rangeOpen && (
                        <div className="absolute right-0 z-20 mt-1 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {["Month", "Quarter"].map((r) => (
                            <button
                              key={r}
                              onMouseDown={() => {
                                setRange(r);
                                setRangeOpen(false);
                              }}
                              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                                r === range ? "text-blue-600 font-medium" : "text-gray-700"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 h-px bg-gray-100" />
                  <div className="mt-4 flex-1">
                    <ActivityChart range={range} />
                  </div>
                </Card>
              </div>

              {/* topics */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <p className="text-sm text-gray-500">Weakest Topics</p>
                  <div className="mt-3 divide-y divide-gray-50">
                    {WEAKEST.map((t) => (
                      <ProgressRow key={t.name} item={t} />
                    ))}
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-gray-500">Strongest Topics</p>
                  <div className="mt-3 divide-y divide-gray-50">
                    {STRONGEST.map((t) => (
                      <ProgressRow key={t.name} item={t} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* leaderboards */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <p className="text-sm text-gray-500">User Leaderboard</p>
                  <div className="mt-3 divide-y divide-gray-50">
                    {USERS.map((u) => (
                      <div key={u.name} className="flex items-center gap-3 py-3">
                        <div
                          className={`w-9 h-9 rounded-full ${u.hue} flex items-center justify-center text-[11px] font-semibold text-white shrink-0`}
                        >
                          {u.name.split(" ").map((p) => p[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.meta}</p>
                        </div>
                        <RankBadge rank={u.rank} up={u.up} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="text-sm text-gray-500">Groups Leaderboard</p>
                  <div className="mt-3 divide-y divide-gray-50">
                    {GROUPS.map((g) => (
                      <div key={g.name} className="flex items-center gap-3 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate">{g.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{g.meta}</p>
                        </div>
                        <RankBadge rank={g.rank} up={g.up} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
