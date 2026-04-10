export interface SkinMask {
  imageData: ImageData;
  width: number;
  height: number;
}

export interface FaceLandmarkResult {
  jawPoints: Array<{ x: number; y: number }>;
  leftEye: Array<{ x: number; y: number }>;
  rightEye: Array<{ x: number; y: number }>;
  leftBrow: Array<{ x: number; y: number }>;  // pts 17-21
  rightBrow: Array<{ x: number; y: number }>; // pts 22-26
  innerLip: Array<{ x: number; y: number }>;
  outerLip: Array<{ x: number; y: number }>;
  nose: Array<{ x: number; y: number }>;
  faceBox: { x: number; y: number; width: number; height: number };
}

export interface SegmentationMask {
  imageData: ImageData;
  width: number;
  height: number;
}
