import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";
import { SegmentationMask } from "@/types/ai";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm";
// Served from public/models/ after running: node scripts/downloadModels.js
const MODEL_URL = "/models/selfie_multiclass_256x256.tflite";

let segmenter: ImageSegmenter | null = null;
let loadPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(): Promise<ImageSegmenter> {
  if (segmenter) return segmenter;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    const instance = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "IMAGE",
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
    segmenter = instance;
    return instance;
  })();

  return loadPromise;
}

const maskCache = new Map<string, SegmentationMask>();

export function clearSegmentationCache(imageId: string) {
  maskCache.delete(imageId);
}

export async function getSegmentationMask(
  canvas: HTMLCanvasElement,
  imageId: string
): Promise<SegmentationMask> {
  if (maskCache.has(imageId)) return maskCache.get(imageId)!;

  const model = await getSegmenter();
  const w = canvas.width;
  const h = canvas.height;

  // segment() is synchronous in IMAGE mode and returns a copy
  const result = model.segment(canvas);
  const out = new ImageData(w, h);

  if (result.confidenceMasks && result.confidenceMasks.length > 0) {
    // Index 0 = background; foreground = 1 - background confidence
    const bg = result.confidenceMasks[0].getAsFloat32Array();
    const n = w * h;
    for (let i = 0; i < n; i++) {
      out.data[i * 4 + 3] = Math.round(Math.max(0, 1 - bg[i]) * 255);
    }
    result.close();
  } else {
    for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  }

  const mask: SegmentationMask = { imageData: out, width: w, height: h };
  maskCache.set(imageId, mask);
  return mask;
}

export function applyBackgroundRemove(
  canvas: HTMLCanvasElement,
  mask: SegmentationMask
): void {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = imageData.data;
  const maskPx = mask.imageData.data;

  for (let i = 0; i < px.length; i += 4) {
    px[i + 3] = maskPx[i + 3];
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function applyBackgroundFill(
  canvas: HTMLCanvasElement,
  mask: SegmentationMask,
  mode: "color" | "gradient",
  fillColor: string,
  gradientStart: string,
  gradientEnd: string,
  gradientAngle: number
): void {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;
  const maskPx = mask.imageData.data;

  const [fR, fG, fB] = hexToRgb(fillColor);
  const [sR, sG, sB] = hexToRgb(gradientStart);
  const [eR, eG, eB] = hexToRgb(gradientEnd);
  const angleRad = (gradientAngle * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const cx = w / 2, cy = h / 2;
  const len = Math.hypot(w, h) / 2;

  for (let i = 0; i < px.length; i += 4) {
    // Sharpen the soft mask so edge pixels snap toward fill rather than
    // blending the original background color in (which causes fringing).
    const raw = maskPx[i + 3] / 255;
    const x = Math.max(0, Math.min(1, (raw - 0.2) / 0.6));
    const fg = x * x * (3 - 2 * x); // smoothstep(0.2, 0.8, raw)

    let bgR: number, bgG: number, bgB: number;
    if (mode === "gradient") {
      const pixIdx = i >>> 2;
      const dx = (pixIdx % w) - cx;
      const dy = ((pixIdx / w) | 0) - cy;
      const t = Math.max(0, Math.min(1, (dx * cosA + dy * sinA) / len * 0.5 + 0.5));
      bgR = sR + (eR - sR) * t;
      bgG = sG + (eG - sG) * t;
      bgB = sB + (eB - sB) * t;
    } else {
      bgR = fR; bgG = fG; bgB = fB;
    }

    // lerp: background in bg areas, original in fg areas — same pattern as applyBackgroundBlur
    px[i]     = Math.round(bgR + (px[i]     - bgR) * fg);
    px[i + 1] = Math.round(bgG + (px[i + 1] - bgG) * fg);
    px[i + 2] = Math.round(bgB + (px[i + 2] - bgB) * fg);
    px[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

export function applyBackgroundBlur(
  canvas: HTMLCanvasElement,
  mask: SegmentationMask,
  blurRadius: number
): void {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d")!;

  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = w;
  bgCanvas.height = h;
  const bgCtx = bgCanvas.getContext("2d")!;
  bgCtx.filter = `blur(${blurRadius}px)`;
  bgCtx.drawImage(canvas, 0, 0);

  const orig = ctx.getImageData(0, 0, w, h);
  const blurred = bgCtx.getImageData(0, 0, w, h);
  const maskPx = mask.imageData.data;
  const out = orig.data;

  for (let i = 0; i < out.length; i += 4) {
    const fg = maskPx[i + 3] / 255;
    out[i]     = blurred.data[i]     + (orig.data[i]     - blurred.data[i])     * fg;
    out[i + 1] = blurred.data[i + 1] + (orig.data[i + 1] - blurred.data[i + 1]) * fg;
    out[i + 2] = blurred.data[i + 2] + (orig.data[i + 2] - blurred.data[i + 2]) * fg;
  }

  ctx.putImageData(orig, 0, 0);
}
