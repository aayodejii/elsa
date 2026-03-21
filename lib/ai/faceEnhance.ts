import { FaceLandmarkResult } from "@/types/ai";

function buildPolygonPath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const pt of points.slice(1)) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();
}

export function applyFaceBrightening(
  canvas: HTMLCanvasElement,
  landmarks: FaceLandmarkResult,
  strength: number
): void {
  const ctx = canvas.getContext("2d")!;
  const amount = (strength / 100) * 0.28; // max 28% soft-light overlay

  // Face polygon from jaw + forehead estimate
  const jaw = landmarks.jawPoints;
  const noseTop = landmarks.nose[0];
  const foreheadY = noseTop.y - (jaw[8].y - noseTop.y) * 0.7;
  const facePolygon = [
    jaw[0],
    ...jaw,
    jaw[16],
    { x: jaw[16].x, y: foreheadY },
    { x: (jaw[0].x + jaw[16].x) / 2, y: foreheadY - 10 },
    { x: jaw[0].x, y: foreheadY },
  ];

  ctx.save();
  buildPolygonPath(ctx, facePolygon);
  ctx.clip();

  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = amount;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

export function applyEyeEnhancement(
  canvas: HTMLCanvasElement,
  landmarks: FaceLandmarkResult,
  strength: number
): void {
  const ctx = canvas.getContext("2d")!;
  const amount = strength / 100;

  for (const eye of [landmarks.leftEye, landmarks.rightEye]) {
    // Compute eye bounding box with padding
    const xs = eye.map((p) => p.x);
    const ys = eye.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = (maxX - minX) * 0.25;
    const padY = (maxY - minY) * 0.5;
    const rx = minX - padX, ry = minY - padY;
    const rw = maxX - minX + padX * 2;
    const rh = maxY - minY + padY * 2;

    // Clip to eye region
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
    ctx.clip();

    // Boost contrast with multiply + screen trick
    const eyeData = ctx.getImageData(rx, ry, rw, rh);
    const d = eyeData.data;
    const contrastFactor = 1 + amount * 0.4;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.max(0, Math.min(255, contrastFactor * (d[i]     - 128) + 128));
      d[i + 1] = Math.max(0, Math.min(255, contrastFactor * (d[i + 1] - 128) + 128));
      d[i + 2] = Math.max(0, Math.min(255, contrastFactor * (d[i + 2] - 128) + 128));
    }
    ctx.putImageData(eyeData, rx, ry);

    // Add subtle white highlight dot
    const highlightX = (eye[1].x + eye[2].x) / 2;
    const highlightY = eye[1].y - (maxY - minY) * 0.2;
    const grad = ctx.createRadialGradient(highlightX, highlightY, 0, highlightX, highlightY, rh * 0.35);
    grad.addColorStop(0, `rgba(255,255,255,${amount * 0.45})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = grad;
    ctx.fillRect(rx, ry, rw, rh);

    ctx.restore();
  }
}

export function applyTeethWhitening(
  canvas: HTMLCanvasElement,
  landmarks: FaceLandmarkResult,
  strength: number
): void {
  const ctx = canvas.getContext("2d")!;
  const amount = strength / 100;

  // Clip to inner lip polygon (mouth opening)
  ctx.save();
  buildPolygonPath(ctx, landmarks.innerLip);
  ctx.clip();

  const { faceBox } = landmarks;
  const rx = Math.floor(faceBox.x);
  const ry = Math.floor(faceBox.y + faceBox.height * 0.6);
  const rw = Math.ceil(faceBox.width);
  const rh = Math.ceil(faceBox.height * 0.4);

  if (rw <= 0 || rh <= 0) { ctx.restore(); return; }

  const imageData = ctx.getImageData(rx, ry, rw, rh);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // Luminance check — only whiten tooth-like pixels (low sat, med-high lightness)
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 510; // 0..1
    const sat = max === 0 ? 0 : (max - min) / max;

    if (sat < 0.35 && l > 0.35) {
      const whiten = amount * 40;
      d[i]     = Math.min(255, r + whiten);
      d[i + 1] = Math.min(255, g + whiten);
      d[i + 2] = Math.min(255, b + whiten);
    }
  }

  ctx.putImageData(imageData, rx, ry);
  ctx.restore();
}
