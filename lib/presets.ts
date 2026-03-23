import type { EditorSettings } from "@/types/editor";

export interface Preset {
  id: string;
  name: string;
  description: string;
  color: string;
  settings: EditorSettings;
}

export const PRESETS: Preset[] = [
  {
    id: "natural",
    name: "Natural",
    description: "Subtle, balanced look",
    color: "#86efac",
    settings: {
      skinRetouch: { enabled: true, strength: 35 },
      freqSep: { enabled: false, strength: 50 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: true, brightness: 20, eyeEnhance: 20, teethWhiten: 20 },
      manual: { brightness: 5, contrast: 5, saturation: -5, sharpness: 10, hue: 0, temperature: 5, tint: 0, shadows: 5, midtones: 0, highlights: -5 },
    },
  },
  {
    id: "studio",
    name: "Studio",
    description: "Polished, professional",
    color: "#c4b5fd",
    settings: {
      skinRetouch: { enabled: true, strength: 60 },
      freqSep: { enabled: true, strength: 60 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: true, brightness: 35, eyeEnhance: 40, teethWhiten: 35 },
      manual: { brightness: 0, contrast: 15, saturation: 5, sharpness: 20, hue: 0, temperature: 0, tint: 0, shadows: -5, midtones: 5, highlights: -10 },
    },
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "High-contrast editorial",
    color: "#fbbf24",
    settings: {
      skinRetouch: { enabled: true, strength: 45 },
      freqSep: { enabled: true, strength: 50 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: true, brightness: 25, eyeEnhance: 50, teethWhiten: 40 },
      manual: { brightness: 5, contrast: 25, saturation: 15, sharpness: 30, hue: 0, temperature: 10, tint: -5, shadows: -15, midtones: 0, highlights: -10 },
    },
  },
  {
    id: "soft-glow",
    name: "Soft Glow",
    description: "Dreamy, lifted skin",
    color: "#f9a8d4",
    settings: {
      skinRetouch: { enabled: true, strength: 70 },
      freqSep: { enabled: true, strength: 70 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: true, brightness: 45, eyeEnhance: 25, teethWhiten: 25 },
      manual: { brightness: 15, contrast: -10, saturation: -10, sharpness: 5, hue: 0, temperature: 15, tint: 5, shadows: 10, midtones: 5, highlights: 0 },
    },
  },
  {
    id: "bw",
    name: "B&W",
    description: "Classic monochrome",
    color: "#94a3b8",
    settings: {
      skinRetouch: { enabled: true, strength: 30 },
      freqSep: { enabled: false, strength: 50 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: true, brightness: 20, eyeEnhance: 30, teethWhiten: 0 },
      manual: { brightness: 5, contrast: 20, saturation: -100, sharpness: 15, hue: 0, temperature: 0, tint: 0, shadows: -10, midtones: 0, highlights: -5 },
    },
  },
  {
    id: "clean",
    name: "Clean",
    description: "Reset all adjustments",
    color: "#22d3ee",
    settings: {
      skinRetouch: { enabled: false, strength: 50 },
      freqSep: { enabled: false, strength: 50 },
      background: { mode: "none", blurRadius: 8 },
      faceEnhance: { enabled: false, brightness: 30, eyeEnhance: 30, teethWhiten: 30 },
      manual: { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, hue: 0, temperature: 0, tint: 0, shadows: 0, midtones: 0, highlights: 0 },
    },
  },
];

const STORAGE_KEY = "elsa_custom_presets";

export function loadCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
