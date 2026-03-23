import { EditorSettings } from "@/types/editor";

interface ManualFilterMessage {
  type: "MANUAL_FILTER";
  imageData: ImageData;
  settings: EditorSettings["manual"];
}

interface SkinRetouchMessage {
  type: "SKIN_RETOUCH";
  imageData: ImageData;
  blurData: ImageData;
  maskData: ImageData;
  strength: number;
}

type WorkerMessage = ManualFilterMessage | SkinRetouchMessage;

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h + 1 / 3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1 / 3) * 255),
  ];
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function applyManualFilter(
  imageData: ImageData,
  settings: EditorSettings["manual"]
): ImageData {
  const { brightness, contrast, saturation, hue, temperature, tint, shadows, midtones, highlights } = settings;
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  const brightDelta = brightness * 2.55;
  const contrastFactor = contrast !== 0 ? (259 * (contrast + 255)) / (255 * (259 - contrast)) : 1;
  const satFactor = 1 + saturation / 100;
  const hueShift = hue / 360;
  const tempDelta = temperature * 0.5;
  const tintDelta = tint * 0.5;

  const doContrast = contrast !== 0;
  const doColor = saturation !== 0 || hue !== 0;
  const doTemp = temperature !== 0;
  const doTint = tint !== 0;
  const doTone = shadows !== 0 || midtones !== 0 || highlights !== 0;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i], g = src[i + 1], b = src[i + 2];

    if (brightness !== 0) {
      r = clamp(r + brightDelta);
      g = clamp(g + brightDelta);
      b = clamp(b + brightDelta);
    }

    if (doContrast) {
      r = clamp(contrastFactor * (r - 128) + 128);
      g = clamp(contrastFactor * (g - 128) + 128);
      b = clamp(contrastFactor * (b - 128) + 128);
    }

    if (doTemp) {
      r = clamp(r + tempDelta);
      b = clamp(b - tempDelta);
    }

    if (doTint) {
      g = clamp(g - tintDelta);
    }

    if (doColor) {
      let [h_, s_, l_] = rgbToHsl(r, g, b);
      if (hue !== 0) h_ = (h_ + hueShift + 1) % 1;
      if (saturation !== 0) s_ = Math.max(0, Math.min(1, s_ * satFactor));
      [r, g, b] = hslToRgb(h_, s_, l_);
    }

    if (doTone) {
      const lum = (r + g + b) / 3 / 255;
      const ws = (1 - lum) * (1 - lum);
      const wm = 4 * lum * (1 - lum);
      const wh = lum * lum;
      const delta = (shadows * ws + midtones * wm + highlights * wh) * 1.5;
      r = clamp(r + delta);
      g = clamp(g + delta);
      b = clamp(b + delta);
    }

    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = src[i + 3];
  }

  return new ImageData(out, imageData.width, imageData.height);
}

function applySkinRetouch(
  imageData: ImageData,
  blurData: ImageData,
  maskData: ImageData,
  strength: number
): ImageData {
  const src = imageData.data;
  const blur = blurData.data;
  const mask = maskData.data;
  const out = new Uint8ClampedArray(src.length);
  const strengthFactor = strength / 100;
  const edgeThreshold = 30;

  for (let i = 0; i < src.length; i += 4) {
    const skinWeight = mask[i] / 255;

    if (skinWeight < 0.01) {
      out[i] = src[i];
      out[i + 1] = src[i + 1];
      out[i + 2] = src[i + 2];
      out[i + 3] = src[i + 3];
      continue;
    }

    const lumOrig = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    const lumBlur = 0.299 * blur[i] + 0.587 * blur[i + 1] + 0.114 * blur[i + 2];
    const edgeWeight = Math.min(1, Math.abs(lumOrig - lumBlur) / edgeThreshold);
    const blend = skinWeight * strengthFactor * (1 - edgeWeight);

    out[i]     = clamp(src[i]     + (blur[i]     - src[i])     * blend);
    out[i + 1] = clamp(src[i + 1] + (blur[i + 1] - src[i + 1]) * blend);
    out[i + 2] = clamp(src[i + 2] + (blur[i + 2] - src[i + 2]) * blend);
    out[i + 3] = src[i + 3];
  }

  return new ImageData(out, imageData.width, imageData.height);
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  if (type === "MANUAL_FILTER") {
    const result = applyManualFilter(e.data.imageData, e.data.settings);
    (self as unknown as Worker).postMessage(
      { type: "RESULT", imageData: result },
      [result.data.buffer]
    );
    return;
  }

  if (type === "SKIN_RETOUCH") {
    const result = applySkinRetouch(
      e.data.imageData,
      e.data.blurData,
      e.data.maskData,
      e.data.strength
    );
    (self as unknown as Worker).postMessage(
      { type: "RESULT", imageData: result },
      [result.data.buffer]
    );
  }
};
