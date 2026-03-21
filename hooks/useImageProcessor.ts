"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore, canvasRegistry, bitmapRegistry } from "@/store/editorStore";
import { useCanvasWorker } from "./useCanvasWorker";
import { EditorSettings } from "@/types/editor";
import { detectFaceLandmarks } from "@/lib/ai/faceDetection";
import { buildSkinMask, buildBlurredCopy } from "@/lib/ai/skinRetouch";
import { getSegmentationMask, applyBackgroundRemove, applyBackgroundBlur } from "@/lib/ai/segmentation";
import { applyFaceBrightening, applyEyeEnhancement, applyTeethWhitening } from "@/lib/ai/faceEnhance";

function isManualDefault(m: EditorSettings["manual"]) {
  return (
    m.brightness === 0 &&
    m.contrast === 0 &&
    m.saturation === 0 &&
    m.sharpness === 0 &&
    m.hue === 0
  );
}

export function useImageProcessor() {
  const { runWorker } = useCanvasWorker();
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );
  const updatePreview = useEditorStore((s) => s.updatePreview);
  const setStatus = useEditorStore((s) => s.setStatus);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(activeImage?.settings);

  useEffect(() => {
    settingsRef.current = activeImage?.settings;
  }, [activeImage?.settings]);

  const processImage = useCallback(
    async (imageId: string, settings: EditorSettings) => {
      const bitmap = bitmapRegistry.get(imageId);
      const canvas = canvasRegistry.get(imageId);
      if (!bitmap || !canvas) return;

      setStatus(imageId, "processing");

      try {
        // Step 1: reset canvas from original bitmap
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);

        // Step 2: background removal / blur
        if (settings.background.mode !== "none") {
          const mask = await getSegmentationMask(canvas, imageId);
          if (settings.background.mode === "remove") {
            applyBackgroundRemove(canvas, mask);
          } else {
            applyBackgroundBlur(canvas, mask, settings.background.blurRadius);
          }
        }

        // Step 3: face enhancement
        if (settings.faceEnhance.enabled) {
          const landmarks = await detectFaceLandmarks(canvas, imageId);
          if (landmarks) {
            if (settings.faceEnhance.brightness > 0)
              applyFaceBrightening(canvas, landmarks, settings.faceEnhance.brightness);
            if (settings.faceEnhance.eyeEnhance > 0)
              applyEyeEnhancement(canvas, landmarks, settings.faceEnhance.eyeEnhance);
            if (settings.faceEnhance.teethWhiten > 0)
              applyTeethWhitening(canvas, landmarks, settings.faceEnhance.teethWhiten);
          }
        }

        // Step 4: skin retouching
        if (settings.skinRetouch.enabled && settings.skinRetouch.strength > 0) {
          const landmarks = await detectFaceLandmarks(canvas, imageId);
          if (landmarks) {
            const maskData = buildSkinMask(canvas.width, canvas.height, landmarks);
            const blurCanvas = buildBlurredCopy(canvas, settings.skinRetouch.strength);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const blurData = blurCanvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
            const result = await runWorker({
              type: "SKIN_RETOUCH",
              imageData,
              blurData,
              maskData,
              strength: settings.skinRetouch.strength,
            });
            ctx.putImageData(result, 0, 0);
          }
        }

        // Step 5: apply manual filters if any are non-default
        if (!isManualDefault(settings.manual)) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Sharpness: generate blur copy in main thread first
          let blurForSharp: ImageData | null = null;
          if (settings.manual.sharpness > 0) {
            const tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = canvas.width;
            tmpCanvas.height = canvas.height;
            const tmpCtx = tmpCanvas.getContext("2d")!;
            const radius = settings.manual.sharpness * 0.02; // 0–2px
            tmpCtx.filter = `blur(${radius}px)`;
            tmpCtx.drawImage(canvas, 0, 0);
            blurForSharp = tmpCtx.getImageData(0, 0, canvas.width, canvas.height);
          }

          // Apply manual filter in worker
          let result = await runWorker({
            type: "MANUAL_FILTER",
            imageData,
            settings: settings.manual,
          });

          // Apply sharpness (unsharp mask) — blend result with blur
          if (blurForSharp && settings.manual.sharpness > 0) {
            const amount = settings.manual.sharpness / 100;
            const sharpData = result.data;
            const blurData = blurForSharp.data;
            const out = new Uint8ClampedArray(sharpData.length);
            for (let i = 0; i < sharpData.length; i += 4) {
              out[i]     = Math.max(0, Math.min(255, sharpData[i]     + (sharpData[i]     - blurData[i])     * amount));
              out[i + 1] = Math.max(0, Math.min(255, sharpData[i + 1] + (sharpData[i + 1] - blurData[i + 1]) * amount));
              out[i + 2] = Math.max(0, Math.min(255, sharpData[i + 2] + (sharpData[i + 2] - blurData[i + 2]) * amount));
              out[i + 3] = sharpData[i + 3];
            }
            result = new ImageData(out, result.width, result.height);
          }

          ctx.putImageData(result, 0, 0);
        }

        // Step 6: export preview
        const format =
          settings.background.mode === "remove" ? "image/png" : "image/jpeg";
        const quality = format === "image/jpeg" ? 0.88 : undefined;
        const dataUrl = canvas.toDataURL(format, quality);
        updatePreview(imageId, dataUrl);
        setStatus(imageId, "done");
      } catch (err) {
        console.error("processing error", err);
        setStatus(imageId, "error");
      }
    },
    [runWorker, updatePreview, setStatus]
  );

  // Debounced auto-process when active image settings change
  useEffect(() => {
    if (!activeImageId || !activeImage) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      processImage(activeImageId, activeImage.settings);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeImageId, activeImage?.settings, processImage]);

  return { processImage };
}
