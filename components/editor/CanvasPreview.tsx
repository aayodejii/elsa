"use client";

import { useEffect, useRef, useState } from "react";
import { canvasRegistry } from "@/store/editorStore";
import { useEditorStore } from "@/store/editorStore";

export default function CanvasPreview() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === activeImageId)
  );

  const displayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Draw the working canvas onto the display canvas whenever previewUrl changes
  useEffect(() => {
    const display = displayRef.current;
    if (!display || !activeImageId) return;

    const srcCanvas = canvasRegistry.get(activeImageId);
    if (!srcCanvas) return;

    display.width = srcCanvas.width;
    display.height = srcCanvas.height;
    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(srcCanvas, 0, 0);
  }, [activeImageId, activeImage?.previewUrl]);

  // Fit zoom to container on image change
  useEffect(() => {
    if (!activeImage || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const fitZoom = Math.min(
      (cw - 48) / activeImage.width,
      (ch - 48) / activeImage.height,
      1
    );
    setZoom(fitZoom);
  }, [activeImage?.id, activeImage?.width, activeImage?.height]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.1, Math.min(4, z + delta)));
  };

  if (!activeImage) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm font-mono">no image selected</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 checkerboard relative overflow-hidden flex items-center justify-center"
      onWheel={handleWheel}
    >
      {/* Zoom badge */}
      <div className="absolute top-3 right-3 z-10 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-md px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
        {Math.round(zoom * 100)}%
      </div>

      {/* Dimensions badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-md px-3 py-1 font-mono text-xs text-[var(--text-muted)]">
        {activeImage.width} × {activeImage.height}
      </div>

      <canvas
        ref={displayRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          imageRendering: zoom > 2 ? "pixelated" : "auto",
          maxWidth: "none",
        }}
        className="shadow-2xl"
      />
    </div>
  );
}
