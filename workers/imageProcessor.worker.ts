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

interface FreqSepMessage {
  type: "FREQ_SEP";
  imageData: ImageData;
  blurSmall: ImageData;
  blurLarge: ImageData;
  maskData: ImageData; // skin mask — alpha channel = skin weight
  strength: number;
}

interface GrainMessage {
  type: "GRAIN";
  imageData: ImageData;
  strength: number;
  size: number;
}

interface DenoiseMessage {
  type: "DENOISE";
  imageData: ImageData;
  strength: number;
}

type WorkerMessage = ManualFilterMessage | SkinRetouchMessage | FreqSepMessage | GrainMessage | DenoiseMessage;

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

function applyFreqSep(
  imageData: ImageData,
  blurSmall: ImageData,
  blurLarge: ImageData,
  maskData: ImageData,
  strength: number
): ImageData {
  const src = imageData.data;
  const bs = blurSmall.data;
  const bl = blurLarge.data;
  const mask = maskData.data;
  const out = new Uint8ClampedArray(src.length);
  const alpha = strength / 100;

  for (let i = 0; i < src.length; i += 4) {
    const skinWeight = mask[i] / 255; // skin mask stored in red channel
    const w = alpha * skinWeight;

    // Frequency separation: out = src + w * (blurLarge - blurSmall)
    // Smooths low-freq (tone/color) while keeping high-freq (texture/pores)
    out[i]     = clamp(src[i]     + w * (bl[i]     - bs[i]));
    out[i + 1] = clamp(src[i + 1] + w * (bl[i + 1] - bs[i + 1]));
    out[i + 2] = clamp(src[i + 2] + w * (bl[i + 2] - bs[i + 2]));
    out[i + 3] = src[i + 3];
  }

  return new ImageData(out, imageData.width, imageData.height);
}

function applyGrain(imageData: ImageData, strength: number, size: number): ImageData {
  const w = imageData.width;
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  const maxDelta = (strength / 100) * 80;

  for (let i = 0; i < src.length; i += 4) {
    const pixIdx = i >>> 2;
    const x = pixIdx % w;
    const y = (pixIdx / w) | 0;
    const gx = size > 1 ? (x / size) | 0 : x;
    const gy = size > 1 ? (y / size) | 0 : y;
    // Park-Miller LCG for deterministic per-grain noise
    const seed = ((Math.imul(gx, 1664525) + Math.imul(gy, 1013904223)) & 0x7fffffff) >>> 0;
    const noise = ((seed >>> 16) & 0xff) / 255;
    const delta = (noise - 0.5) * 2 * maxDelta;
    out[i]     = clamp(src[i]     + delta);
    out[i + 1] = clamp(src[i + 1] + delta);
    out[i + 2] = clamp(src[i + 2] + delta);
    out[i + 3] = src[i + 3];
  }
  return new ImageData(out, imageData.width, imageData.height);
}

function applyDenoise(imageData: ImageData, strength: number): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  // Variance-based adaptive smoother: only smooths flat/noisy areas, preserves edges.
  // High local variance = edge/detail → keep original.
  // Low local variance = flat area/noise → blend toward neighborhood average.
  // threshold maps strength 0-100 → variance threshold 80-800
  const threshold = 80 + (strength / 100) * 720;
  const blendScale = strength / 100;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ci = (y * w + x) * 4;
      let sumLum = 0, sumLumSq = 0, sumR = 0, sumG = 0, sumB = 0;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = Math.max(0, Math.min(h - 1, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(w - 1, x + dx));
          const ni = (ny * w + nx) * 4;
          const r = src[ni], g = src[ni + 1], b = src[ni + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          sumLum += lum;
          sumLumSq += lum * lum;
          sumR += r; sumG += g; sumB += b;
        }
      }

      const avgLum = sumLum / 9;
      const variance = sumLumSq / 9 - avgLum * avgLum;
      // blend = 1 in flat areas (variance=0), 0 at edges (variance >= threshold)
      const blend = Math.max(0, 1 - variance / threshold) * blendScale;

      out[ci]     = Math.round(src[ci]     * (1 - blend) + (sumR / 9) * blend);
      out[ci + 1] = Math.round(src[ci + 1] * (1 - blend) + (sumG / 9) * blend);
      out[ci + 2] = Math.round(src[ci + 2] * (1 - blend) + (sumB / 9) * blend);
      out[ci + 3] = src[ci + 3];
    }
  }

  return new ImageData(out, w, h);
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
    return;
  }

  if (type === "FREQ_SEP") {
    const result = applyFreqSep(
      e.data.imageData,
      e.data.blurSmall,
      e.data.blurLarge,
      e.data.maskData,
      e.data.strength
    );
    (self as unknown as Worker).postMessage(
      { type: "RESULT", imageData: result },
      [result.data.buffer]
    );
    return;
  }

  if (type === "GRAIN") {
    const result = applyGrain(e.data.imageData, e.data.strength, e.data.size);
    (self as unknown as Worker).postMessage(
      { type: "RESULT", imageData: result },
      [result.data.buffer]
    );
    return;
  }

  if (type === "DENOISE") {
    const result = applyDenoise(e.data.imageData, e.data.strength);
    (self as unknown as Worker).postMessage(
      { type: "RESULT", imageData: result },
      [result.data.buffer]
    );
  }
};
