// ESM wrapper for @mediapipe/selfie_segmentation.
// Turbopack cannot statically analyze named exports from the CJS IIFE bundle,
// so we import it as a default and re-export the class explicitly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import s from "@mediapipe/selfie_segmentation/selfie_segmentation.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SelfieSegmentation = (s as any).SelfieSegmentation;
