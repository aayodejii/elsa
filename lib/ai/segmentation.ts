import { SegmentationMask } from "@/types/ai";

type Segmenter = Awaited<ReturnType<typeof import("@tensorflow-models/body-segmentation").createSegmenter>>;

let segmenter: Segmenter | null = null;
let loading = false;
let loadPromise: Promise<Segmenter> | null = null;

async function getSegmenter(): Promise<Segmenter> {
  if (segmenter) return segmenter;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    const bodySegmentation = await import("@tensorflow-models/body-segmentation");
    await import("@tensorflow/tfjs-backend-webgl");
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();

    const model = await bodySegmentation.createSegmenter(
      bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      {
        runtime: "mediapipe" as const,
        solutionPath:
          "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation",
        modelType: "general",
      }
    );
    segmenter = model;
    loading = false;
    return model;
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
  const segmentations = await model.segmentPeople(canvas);

  if (!segmentations.length) {
    const fallback: SegmentationMask = {
      imageData: new ImageData(canvas.width, canvas.height),
      width: canvas.width,
      height: canvas.height,
    };
    // fill all white (keep everything)
    const d = fallback.imageData.data;
    for (let i = 3; i < d.length; i += 4) d[i] = 255;
    maskCache.set(imageId, fallback);
    return fallback;
  }

  const maskImageData = await segmentations[0].mask.toImageData();
  const result: SegmentationMask = {
    imageData: maskImageData,
    width: canvas.width,
    height: canvas.height,
  };
  maskCache.set(imageId, result);
  return result;
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
    px[i + 3] = maskPx[i + 3]; // use mask alpha as output alpha
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

  // Blurred version of the original
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
    const fg = maskPx[i + 3] / 255; // 1 = subject, 0 = background
    out[i]     = blurred.data[i]     + (orig.data[i]     - blurred.data[i])     * fg;
    out[i + 1] = blurred.data[i + 1] + (orig.data[i + 1] - blurred.data[i + 1]) * fg;
    out[i + 2] = blurred.data[i + 2] + (orig.data[i + 2] - blurred.data[i + 2]) * fg;
  }

  ctx.putImageData(orig, 0, 0);
}
