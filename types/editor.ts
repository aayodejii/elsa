export interface EditorSettings {
  skinRetouch: {
    enabled: boolean;
    strength: number; // 0–100
  };
  freqSep: {
    enabled: boolean;
    strength: number; // 0–100
  };
  background: {
    mode: "none" | "remove" | "blur" | "color" | "gradient";
    blurRadius: number; // 0–20
    fillColor: string;     // hex, used when mode = "color"
    gradientStart: string; // hex, used when mode = "gradient"
    gradientEnd: string;   // hex, used when mode = "gradient"
    gradientAngle: number; // 0–360 degrees
  };
  faceEnhance: {
    enabled: boolean;
    brightness: number; // 0–100
    eyeEnhance: number; // 0–100
    teethWhiten: number; // 0–100
  };
  manual: {
    brightness: number;   // -100 to 100
    contrast: number;     // -100 to 100
    saturation: number;   // -100 to 100
    sharpness: number;    // 0–100
    hue: number;          // -180 to 180
    temperature: number;  // -100 to 100 (cool → warm)
    tint: number;         // -100 to 100 (green → magenta)
    shadows: number;      // -100 to 100
    midtones: number;     // -100 to 100
    highlights: number;   // -100 to 100
  };
  vignette: {
    enabled: boolean;
    strength: number; // 0–100
  };
  grain: {
    enabled: boolean;
    strength: number; // 0–100
    size: number;     // 1–5
  };
  denoiser: {
    enabled: boolean;
    strength: number; // 0–100
  };
}

export interface ImageItem {
  id: string;
  file: File;
  originalBitmap: ImageBitmap;
  currentCanvas: HTMLCanvasElement;
  thumbnail: string;
  status: ProcessingStatus;
  settings: EditorSettings;
  settingsHistory: EditorSettings[];
  historyIndex: number;
}

export type ProcessingStatus = "idle" | "processing" | "done" | "error";

export const DEFAULT_SETTINGS: EditorSettings = {
  skinRetouch: { enabled: false, strength: 50 },
  freqSep: { enabled: false, strength: 50 },
  background: { mode: "none", blurRadius: 8, fillColor: "#1a1a2e", gradientStart: "#1a1a2e", gradientEnd: "#16213e", gradientAngle: 135 },
  faceEnhance: { enabled: false, brightness: 30, eyeEnhance: 30, teethWhiten: 30 },
  manual: { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, hue: 0, temperature: 0, tint: 0, shadows: 0, midtones: 0, highlights: 0 },
  vignette: { enabled: false, strength: 50 },
  grain: { enabled: false, strength: 30, size: 1 },
  denoiser: { enabled: false, strength: 50 },
};
