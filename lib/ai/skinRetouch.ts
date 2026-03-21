import { FaceLandmarkResult } from "@/types/ai";

function estimateForehead(
  jaw: Array<{ x: number; y: number }>,
  nose: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  // Estimate forehead by reflecting the top of the jaw over the nose bridge
  const noseTop = nose[0];
  const jawTop = jaw[8]; // chin
  const foreheadOffset = (jawTop.y - noseTop.y) * 0.85;

  return [
    { x: jaw[0].x, y: jaw[0].y - foreheadOffset * 0.6 },
    { x: (jaw[0].x + jaw[16].x) / 2, y: noseTop.y - foreheadOffset * 0.4 },
    { x: jaw[16].x, y: jaw[16].y - foreheadOffset * 0.6 },
  ];
}

export function buildSkinMask(
  width: number,
  height: number,
  landmarks: FaceLandmarkResult
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Build face polygon: jaw + forehead
  const forehead = estimateForehead(landmarks.jawPoints, landmarks.nose);
  const polygon = [
    landmarks.jawPoints[0],
    ...landmarks.jawPoints,
    landmarks.jawPoints[16],
    forehead[2],
    forehead[1],
    forehead[0],
  ];

  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (const pt of polygon.slice(1)) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();

  ctx.fillStyle = "white";
  ctx.fill();

  // Cut out eyes
  for (const eye of [landmarks.leftEye, landmarks.rightEye]) {
    ctx.beginPath();
    ctx.moveTo(eye[0].x, eye[0].y);
    for (const pt of eye.slice(1)) ctx.lineTo(pt.x, pt.y);
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
  }

  // Cut out lips
  ctx.beginPath();
  ctx.moveTo(landmarks.outerLip[0].x, landmarks.outerLip[0].y);
  for (const pt of landmarks.outerLip.slice(1)) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();
  ctx.fillStyle = "black";
  ctx.fill();

  // Soften mask edges with slight blur
  ctx.filter = "blur(4px)";
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.filter = "blur(4px)";
  tempCtx.drawImage(canvas, 0, 0);

  return tempCtx.getImageData(0, 0, width, height);
}

export function buildBlurredCopy(
  canvas: HTMLCanvasElement,
  strength: number
): HTMLCanvasElement {
  const blurRadius = (strength / 100) * 6; // max 6px blur
  const tmp = document.createElement("canvas");
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  const ctx = tmp.getContext("2d")!;
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.drawImage(canvas, 0, 0);
  return tmp;
}
