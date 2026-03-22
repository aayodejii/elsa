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
    const xs = eye.map((p) => p.x);
    const ys = eye.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = (maxX - minX) * 0.25;
    const padY = (maxY - minY) * 0.5;
    const rx = Math.floor(minX - padX), ry = Math.floor(minY - padY);
    const rw = Math.ceil(maxX - minX + padX * 2);
    const rh = Math.ceil(maxY - minY + padY * 2);

    if (rw <= 0 || rh <= 0) continue;

    // Contrast boost on a temp canvas
    const tmp = document.createElement("canvas");
    tmp.width = rw;
    tmp.height = rh;
    const tmpCtx = tmp.getContext("2d")!;
    const eyeData = ctx.getImageData(rx, ry, rw, rh);
    const d = eyeData.data;
    const contrastFactor = 1 + amount * 0.4;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.max(0, Math.min(255, contrastFactor * (d[i]     - 128) + 128));
      d[i + 1] = Math.max(0, Math.min(255, contrastFactor * (d[i + 1] - 128) + 128));
      d[i + 2] = Math.max(0, Math.min(255, contrastFactor * (d[i + 2] - 128) + 128));
    }
    tmpCtx.putImageData(eyeData, 0, 0);

    // Draw back through ellipse clip
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(tmp, rx, ry);

    // Highlight dot
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

  const lip = landmarks.innerLip;
  const lxs = lip.map((p) => p.x), lys = lip.map((p) => p.y);
  const rx = Math.floor(Math.min(...lxs)) - 2;
  const ry = Math.floor(Math.min(...lys)) - 2;
  const rw = Math.ceil(Math.max(...lxs) - rx) + 4;
  const rh = Math.ceil(Math.max(...lys) - ry) + 4;

  if (rw <= 0 || rh <= 0) return;

  // Whiten on a temp canvas
  const tmp = document.createElement("canvas");
  tmp.width = rw;
  tmp.height = rh;
  const tmpCtx = tmp.getContext("2d")!;
  const imageData = ctx.getImageData(rx, ry, rw, rh);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const sat = max === 0 ? 0 : (max - min) / max;

    if (sat < 0.35 && l > 0.35) {
      const whiten = amount * 40;
      d[i]     = Math.min(255, r + whiten);
      d[i + 1] = Math.min(255, g + whiten);
      d[i + 2] = Math.min(255, b + whiten);
    }
  }
  tmpCtx.putImageData(imageData, 0, 0);

  // Draw back through inner lip clip
  ctx.save();
  buildPolygonPath(ctx, lip);
  ctx.clip();
  ctx.drawImage(tmp, rx, ry);
  ctx.restore();
}
