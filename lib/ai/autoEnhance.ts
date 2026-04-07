import { bitmapRegistry } from "@/store/editorStore";
import type { EditorSettings } from "@/types/editor";

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }

  return [h, max === 0 ? 0 : delta / max, max];
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  const [h, s, v] = rgbToHsv(r, g, b);
  return h >= 0 && h <= 50 && s >= 0.15 && s <= 0.85 && v >= 0.2 && v <= 0.95;
}

function analyzeImage(imageId: string): { avgLuminance: number; skinRatio: number; avgSaturation: number } | null {
  const bitmap = bitmapRegistry.get(imageId);
  if (!bitmap) return null;

  const SIZE = 200;
  const scale = Math.min(SIZE / bitmap.width, SIZE / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const total = w * h;
  let totalLum = 0, totalSat = 0, skinCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    totalLum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalSat += rgbToHsv(r, g, b)[1];
    if (isSkinPixel(r, g, b)) skinCount++;
  }

  return {
    avgLuminance: totalLum / total,
    skinRatio: skinCount / total,
    avgSaturation: totalSat / total,
  };
}

export function computeAutoEnhanceSettings(imageId: string): Partial<EditorSettings> | null {
  const analysis = analyzeImage(imageId);
  if (!analysis) return null;

  const { avgLuminance, skinRatio, avgSaturation } = analysis;

  // Target ~140 luminance; halved to avoid over-correction
  const brightnessDelta = Math.round(((140 - avgLuminance) / 2.55) * 0.5);
  const brightness = Math.max(-50, Math.min(50, brightnessDelta));

  const hasSkin = skinRatio > 0.05;
  const skinStrength = Math.min(65, Math.round(skinRatio * 180));

  return {
    skinRetouch: { enabled: hasSkin, strength: hasSkin ? skinStrength : 50 },
    freqSep: { enabled: false, strength: 50 },
    vignette: { enabled: false, strength: 50 },
    grain: { enabled: false, strength: 30, size: 1 },
    denoiser: { enabled: false, strength: 50 },
    faceEnhance: {
      enabled: hasSkin,
      brightness: hasSkin ? 25 : 0,
      eyeEnhance: hasSkin ? 30 : 0,
      teethWhiten: hasSkin ? 20 : 0,
    },
    manual: {
      brightness,
      contrast: 8,
      saturation: avgSaturation < 0.2 ? 10 : 0,
      sharpness: 15,
      hue: 0,
      temperature: 0,
      tint: 0,
      shadows: 0,
      midtones: 0,
      highlights: 0,
    },
  };
}
