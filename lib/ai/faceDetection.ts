import * as faceapi from "@vladmandic/face-api";
import { FaceLandmarkResult } from "@/types/ai";
import { ensureTfReady } from "./tfBackend";

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;
  // Ensure the TF.js WebGL backend is ready before loading face-api models
  await ensureTfReady();
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
  modelsLoaded = true;
}

const landmarkCache = new Map<string, FaceLandmarkResult | null>();

export function clearLandmarkCache(imageId: string) {
  landmarkCache.delete(imageId);
}

export async function detectFaceLandmarks(
  canvas: HTMLCanvasElement,
  imageId: string
): Promise<FaceLandmarkResult | null> {
  if (landmarkCache.has(imageId)) return landmarkCache.get(imageId)!;

  await loadFaceApiModels();

  const detection = await faceapi
    .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true);

  if (!detection) {
    landmarkCache.set(imageId, null);
    return null;
  }

  const pts = detection.landmarks.positions;

  const toXY = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });

  const result: FaceLandmarkResult = {
    jawPoints: pts.slice(0, 17).map(toXY),
    leftEye: pts.slice(36, 42).map(toXY),
    rightEye: pts.slice(42, 48).map(toXY),
    outerLip: pts.slice(48, 60).map(toXY),
    innerLip: pts.slice(60, 68).map(toXY),
    nose: pts.slice(27, 36).map(toXY),
    faceBox: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    },
  };

  landmarkCache.set(imageId, result);
  return result;
}
