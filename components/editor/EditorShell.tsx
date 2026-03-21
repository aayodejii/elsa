"use client";

import { useCallback, useState } from "react";
import Toolbar from "./Toolbar";
import CanvasPreview from "./CanvasPreview";
import ProcessingOverlay from "./ProcessingOverlay";
import SidebarPanel from "@/components/sidebar/SidebarPanel";
import ManualAdjustPanel from "@/components/sidebar/ManualAdjustPanel";
import SkinRetouchPanel from "@/components/sidebar/SkinRetouchPanel";
import BackgroundPanel from "@/components/sidebar/BackgroundPanel";
import FaceEnhancePanel from "@/components/sidebar/FaceEnhancePanel";
import BatchPanel from "@/components/batch/BatchPanel";
import DropZone from "@/components/upload/DropZone";
import { useEditorStore } from "@/store/editorStore";
import { useBatchStore } from "@/store/batchStore";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { downloadAllAsZip } from "@/lib/zip/batchExport";

export default function EditorShell() {
  const images = useEditorStore((s) => s.images);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setProcessingProgress = useEditorStore((s) => s.setProcessingProgress);
  const hasImages = images.length > 0;

  const { startBatch, incrementDone, finishBatch } = useBatchStore();
  const { processImage } = useImageProcessor();

  const [zoom, setZoom] = useState(1);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(4, z + 0.25)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.1, z - 0.25)), []);
  const handleZoomFit = useCallback(() => setZoom(1), []);

  const handleProcessAll = useCallback(async () => {
    if (images.length === 0) return;
    startBatch(images.length);
    setIsProcessing(true);
    setProcessingProgress(0);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await processImage(img.id, img.settings);
      incrementDone();
      setProcessingProgress(Math.round(((i + 1) / images.length) * 100));
    }
    finishBatch();
    setIsProcessing(false);
  }, [images, processImage, startBatch, incrementDone, finishBatch, setIsProcessing, setProcessingProgress]);

  const handleDownloadAll = useCallback(() => {
    downloadAllAsZip(images);
  }, [images]);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Toolbar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomFit={handleZoomFit} />

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <SidebarPanel
          skinRetouchPanel={<SkinRetouchPanel />}
          backgroundPanel={<BackgroundPanel />}
          faceEnhancePanel={<FaceEnhancePanel />}
          manualAdjustPanel={<ManualAdjustPanel />}
        />

        {/* Main canvas area */}
        <main className="flex-1 relative flex flex-col min-w-0">
          {hasImages ? <CanvasPreview zoom={zoom} onZoomChange={setZoom} /> : <DropZone />}
          <ProcessingOverlay />
        </main>

        {/* Right batch panel */}
        <BatchPanel onProcessAll={handleProcessAll} onDownloadAll={handleDownloadAll} />
      </div>
    </div>
  );
}
