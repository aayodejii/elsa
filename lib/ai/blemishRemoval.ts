import type { BlemishSpot } from "@/types/editor";

function getPatchVariance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number
): number {
  let sum = 0, sumSq = 0, count = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const i = (ny * width + nx) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
      count++;
    }
  }
  if (count < 2) return Infinity;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function findBestSourcePatch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number } | null {
  const directions = 12;
  const radiusMultipliers = [1.5, 2.0, 2.5, 3.0];
  let bestVariance = Infinity;
  let best: { x: number; y: number } | null = null;

  for (const mult of radiusMultipliers) {
    for (let d = 0; d < directions; d++) {
      const angle = (d / directions) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(angle) * r * mult);
      const sy = Math.round(cy + Math.sin(angle) * r * mult);
      if (sx - r < 0 || sy - r < 0 || sx + r >= width || sy + r >= height) continue;
      const variance = getPatchVariance(data, width, height, sx, sy, r);
      if (variance < bestVariance) {
        bestVariance = variance;
        best = { x: sx, y: sy };
      }
    }
  }

  return best;
}

function blendPatch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  dx: number,
  dy: number,
  r: number,
  sx: number,
  sy: number
): void {
  const r2 = r * r;
  for (let oy = -r; oy <= r; oy++) {
    for (let ox = -r; ox <= r; ox++) {
      const d2 = ox * ox + oy * oy;
      if (d2 > r2) continue;
      const nx = dx + ox, ny = dy + oy;
      const nsx = sx + ox, nsy = sy + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (nsx < 0 || nsy < 0 || nsx >= width || nsy >= height) continue;

      const dist = Math.sqrt(d2) / r;
      const weight = 1 - dist * dist; // Gaussian-like falloff

      const di = (ny * width + nx) * 4;
      const si = (nsy * width + nsx) * 4;

      data[di]     = Math.round(data[di]     * (1 - weight) + data[si]     * weight);
      data[di + 1] = Math.round(data[di + 1] * (1 - weight) + data[si + 1] * weight);
      data[di + 2] = Math.round(data[di + 2] * (1 - weight) + data[si + 2] * weight);
    }
  }
}

export function applyBlemishHealing(canvas: HTMLCanvasElement, spots: BlemishSpot[]): void {
  if (spots.length === 0) return;
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (const spot of spots) {
    const cx = Math.round(spot.x * width);
    const cy = Math.round(spot.y * height);
    const r = Math.max(3, Math.round(spot.radius * width));

    const src = findBestSourcePatch(data, width, height, cx, cy, r);
    if (!src) continue;
    blendPatch(data, width, height, cx, cy, r, src.x, src.y);
  }

  ctx.putImageData(imageData, 0, 0);
}
