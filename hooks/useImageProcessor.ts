"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore, canvasRegistry, bitmapRegistry } from "@/store/editorStore";
import { useCanvasWorker } from "./useCanvasWorker";
import { EditorSettings } from "@/types/editor";
import { detectFaceLandmarks } from "@/lib/ai/faceDetection";
import { buildSkinMask, buildBlurredCopy } from "@/lib/ai/skinRetouch";
import { getSegmentationMask, applyBackgroundRemove, applyBackgroundBlur, applyBackgroundFill } from "@/lib/ai/segmentation";
import { applyFaceBrightening, applyEyeEnhancement, applyTeethWhitening } from "@/lib/ai/faceEnhance";

function isManualDefault(m: EditorSettings["manual"]) {
  return (
    m.brightness === 0 &&
    m.contrast === 0 &&
    m.saturation === 0 &&
    m.sharpness === 0 &&
    m.hue === 0 &&
    m.temperature === 0 &&
    m.tint === 0 &&
    m.shadows === 0 &&
    m.midtones === 0 &&
    m.highlights === 0
  );
}

/** Wraps a promise with a timeout so AI steps cannot hang forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export function useImageProcessor() {
  const { runWorker } = useCanvasWorker();
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );
  const updatePreview = useEditorStore((s) => s.updatePreview);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setProcessingProgress = useEditorStore((s) => s.setProcessingProgress);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setProcessingProgress(5);

      try {
        // Step 1: reset canvas from original bitmap
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        setProcessingProgress(10);

        // Step 2: background removal / blur
        if (settings.background.mode !== "none") {
          try {
            const mask = await withTimeout(
              getSegmentationMask(canvas, imageId), 30_000, "Background segmentation"
            );
            setProcessingProgress(40);
            if (settings.background.mode === "remove") {
              applyBackgroundRemove(canvas, mask);
            } else if (settings.background.mode === "color" || settings.background.mode === "gradient") {
              applyBackgroundFill(
                canvas, mask,
                settings.background.mode,
                settings.background.fillColor,
                settings.background.gradientStart,
                settings.background.gradientEnd,
                settings.background.gradientAngle
              );
            } else {
              applyBackgroundBlur(canvas, mask, settings.background.blurRadius);
            }
          } catch (err) {
            console.warn("Background segmentation failed, skipping:", err);
          }
          setProcessingProgress(50);
        }

        // Step 3: face enhancement
        if (settings.faceEnhance.enabled) {
          try {
            const landmarks = await withTimeout(
              detectFaceLandmarks(canvas, imageId), 30_000, "Face detection"
            );
            setProcessingProgress(65);
            if (landmarks) {
              if (settings.faceEnhance.brightness > 0)
                applyFaceBrightening(canvas, landmarks, settings.faceEnhance.brightness);
              if (settings.faceEnhance.eyeEnhance > 0)
                applyEyeEnhancement(canvas, landmarks, settings.faceEnhance.eyeEnhance);
              if (settings.faceEnhance.teethWhiten > 0)
                applyTeethWhitening(canvas, landmarks, settings.faceEnhance.teethWhiten);
            }
          } catch (err) {
            console.warn("Face enhancement failed, skipping:", err);
          }
          setProcessingProgress(70);
        }

        // Step 4: skin retouching
        if (settings.skinRetouch.enabled && settings.skinRetouch.strength > 0) {
          try {
            const landmarks = await withTimeout(
              detectFaceLandmarks(canvas, imageId), 30_000, "Face detection (skin retouch)"
            );
            setProcessingProgress(80);
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
          } catch (err) {
            console.warn("Skin retouching failed, skipping:", err);
          }
          setProcessingProgress(88);
        }

        // Step 5: frequency separation (skin-only, texture-preserving smoothing)
        if (settings.freqSep.enabled && settings.freqSep.strength > 0) {
          try {
            const landmarks = await withTimeout(
              detectFaceLandmarks(canvas, imageId), 30_000, "Face detection (freq sep)"
            );
            if (landmarks) {
              const maskData = buildSkinMask(canvas.width, canvas.height, landmarks);
              const s = settings.freqSep.strength;
              const largeRadius = Math.round(2 + (s / 100) * 12);

              const makeBlur = (radius: number) => {
                const tmp = document.createElement("canvas");
                tmp.width = canvas.width;
                tmp.height = canvas.height;
                const tCtx = tmp.getContext("2d")!;
                tCtx.filter = `blur(${radius}px)`;
                tCtx.drawImage(canvas, 0, 0);
                return tCtx.getImageData(0, 0, canvas.width, canvas.height);
              };

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = await runWorker({
                type: "FREQ_SEP",
                imageData,
                blurSmall: makeBlur(2),
                blurLarge: makeBlur(largeRadius),
                maskData,
                strength: s,
              });
              ctx.putImageData(result, 0, 0);
            }
          } catch (err) {
            console.warn("Frequency separation failed, skipping:", err);
          }
          setProcessingProgress(92);
        }

        // Step 6: apply manual filters if any are non-default
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
          setProcessingProgress(95);
        }

        // Step 7: denoiser
        if (settings.denoiser.enabled && settings.denoiser.strength > 0) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = await runWorker({ type: "DENOISE", imageData, strength: settings.denoiser.strength });
            ctx.putImageData(result, 0, 0);
          } catch (err) {
            console.warn("Denoiser failed, skipping:", err);
          }
        }

        // Step 8: vignette (main thread — radial gradient composite)
        if (settings.vignette.enabled && settings.vignette.strength > 0) {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const radius = Math.hypot(cx, cy);
          const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, `rgba(0,0,0,${((settings.vignette.strength / 100) * 0.75).toFixed(3)})`);
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        // Step 9: grain (last — applied on top of everything)
        if (settings.grain.enabled && settings.grain.strength > 0) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = await runWorker({ type: "GRAIN", imageData, strength: settings.grain.strength, size: settings.grain.size });
            ctx.putImageData(result, 0, 0);
          } catch (err) {
            console.warn("Grain failed, skipping:", err);
          }
          setProcessingProgress(98);
        }

        // Export preview
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
    [runWorker, updatePreview, setStatus, setProcessingProgress]
  );

  // Debounced auto-process when active image settings change
  useEffect(() => {
    if (!activeImageId || !activeImage) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Only show overlay if processing takes >150ms (cached AI is near-instant)
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = setTimeout(() => {
        setIsProcessing(true);
        setProcessingProgress(0);
      }, 150);

      processImage(activeImageId, activeImage.settings).finally(() => {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
        setIsProcessing(false);
        setProcessingProgress(100);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [activeImageId, activeImage?.settings, processImage, setIsProcessing, setProcessingProgress]);

  return { processImage };
}
