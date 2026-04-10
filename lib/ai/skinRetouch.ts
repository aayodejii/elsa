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

export function buildWrinkleMask(
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
  ctx.fillStyle = "white";

  // Forehead zone: polygon bounded by eyebrows below and face box top
  const allBrowPts = [...landmarks.leftBrow, ...landmarks.rightBrow];
  const browMinY = Math.min(...allBrowPts.map((p) => p.y));
  const leftX = landmarks.leftBrow[0].x;
  const rightX = landmarks.rightBrow[landmarks.rightBrow.length - 1].x;
  const faceTopY = landmarks.faceBox.y + 4;
  ctx.beginPath();
  ctx.moveTo(leftX, faceTopY);
  ctx.lineTo(rightX, faceTopY);
  // Follow eyebrow contour at bottom
  for (const pt of [...landmarks.rightBrow].reverse()) ctx.lineTo(pt.x, pt.y);
  for (const pt of landmarks.leftBrow) ctx.lineTo(pt.x, pt.y);
  ctx.lineTo(leftX, Math.min(browMinY - 2, browMinY));
  ctx.closePath();
  ctx.fill();

  // Nasolabial folds: two elongated ellipses from nose wings to mouth corners
  // nose[4]=pt31 (left nostril), nose[8]=pt35 (right nostril)
  // outerLip[0]=pt48 (left corner), outerLip[6]=pt54 (right corner)
  const folds: [typeof landmarks.nose[0], typeof landmarks.outerLip[0]][] = [
    [landmarks.nose[4], landmarks.outerLip[0]],
    [landmarks.nose[8], landmarks.outerLip[6]],
  ];
  for (const [nostril, mouth] of folds) {
    const cx = (nostril.x + mouth.x) / 2;
    const cy = (nostril.y + mouth.y) / 2;
    const angle = Math.atan2(mouth.y - nostril.y, mouth.x - nostril.x);
    const halfLen = Math.hypot(mouth.x - nostril.x, mouth.y - nostril.y) * 0.55;
    const halfWid = halfLen * 0.28;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, halfLen, halfWid, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Soften edges
  const tmp = document.createElement("canvas");
  tmp.width = width;
  tmp.height = height;
  const tmpCtx = tmp.getContext("2d")!;
  tmpCtx.filter = "blur(5px)";
  tmpCtx.drawImage(canvas, 0, 0);
  return tmpCtx.getImageData(0, 0, width, height);
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
