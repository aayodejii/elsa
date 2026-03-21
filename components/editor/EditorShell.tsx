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
import { useImageProcessor } from "@/hooks/useImageProcessor";

export default function EditorShell() {
  const images = useEditorStore((s) => s.images);
  const hasImages = images.length > 0;

  useImageProcessor();

  const [zoom, setZoom] = useState(1);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(4, z + 0.25)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.1, z - 0.25)), []);
  const handleZoomFit = useCallback(() => setZoom(1), []);

  const handleProcessAll = useCallback(() => {
    // Will be wired up in Phase 7
    console.log("process all");
  }, []);

  const handleDownloadAll = useCallback(() => {
    // Will be wired up in Phase 7
    console.log("download all");
  }, []);

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
