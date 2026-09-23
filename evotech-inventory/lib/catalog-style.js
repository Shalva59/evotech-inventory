"use client";

import {
  Battery,
  BatteryCharging,
  Bluetooth,
  Cable,
  Camera,
  Car,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Lightbulb,
  MemoryStick,
  Mic,
  Monitor,
  Mouse,
  Package,
  Plug,
  PlugZap,
  ShieldCheck,
  Smartphone,
  Speaker,
  Sparkles,
  Tablet,
  Usb,
  Watch,
  Wrench,
  Zap,
} from "lucide-react";

/**
 * Categories get an icon and a colour instead of a photograph.
 *
 * A shop owner will not hunt down a picture for "20W chargers", so a tile
 * that depends on one stays empty and the page looks unfinished. An icon and
 * a colour are two clicks, always available, and read faster across a room
 * than a photo of a cable does.
 */
export const CATEGORY_ICONS = {
  package: Package,
  headphones: Headphones,
  speaker: Speaker,
  cable: Cable,
  usb: Usb,
  plug: Plug,
  plugZap: PlugZap,
  batteryCharging: BatteryCharging,
  battery: Battery,
  zap: Zap,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
  watch: Watch,
  keyboard: Keyboard,
  mouse: Mouse,
  camera: Camera,
  mic: Mic,
  bluetooth: Bluetooth,
  shield: ShieldCheck,
  wrench: Wrench,
  hardDrive: HardDrive,
  memory: MemoryStick,
  gamepad: Gamepad2,
  lightbulb: Lightbulb,
  car: Car,
  sparkles: Sparkles,
};

export const ICON_KEYS = Object.keys(CATEGORY_ICONS);

/**
 * Nine accents that all hold up on the near-black surface. Each is stored as
 * raw HSL parts so the tile can mix its own translucent fill and border from
 * a single value — Tailwind cannot build class names at runtime.
 */
export const CATEGORY_COLORS = {
  brass: "38 55% 52%",
  jade: "158 46% 45%",
  info: "213 55% 62%",
  violet: "265 45% 64%",
  rose: "344 52% 60%",
  amber: "28 62% 56%",
  teal: "186 50% 48%",
  lime: "88 38% 50%",
  slate: "214 14% 52%",
};

export const COLOR_KEYS = Object.keys(CATEGORY_COLORS);

export function iconFor(key) {
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.package;
}

export function colorFor(key) {
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.slate;
}

/**
 * Categories created before icons existed — or added in a hurry from the
 * product form — still need to look deliberate. Hashing the name gives the
 * same category the same colour every time, which is what matters.
 */
export function fallbackColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return COLOR_KEYS[hash % COLOR_KEYS.length];
}

/** The CSS custom property every tile reads. */
export function tileStyle(colorKey, name) {
  return { "--tile": colorFor(colorKey ?? fallbackColor(name)) };
}
