"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { canvasRegistry, bitmapRegistry, useEditorStore } from "@/store/editorStore";

interface CanvasPreviewProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function CanvasPreview({ zoom, onZoomChange }: CanvasPreviewProps) {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const activeImage = useEditorStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const compareMode = useEditorStore((s) => s.compareMode);
  const blemishMode = useEditorStore((s) => s.blemishMode);
  const blemishRadius = useEditorStore((s) => s.blemishRadius);
  const addBlemishSpot = useEditorStore((s) => s.addBlemishSpot);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const draw = useCallback(() => {
    const display = displayRef.current;
    if (!display || !activeImageId) return;
    const srcCanvas = canvasRegistry.get(activeImageId);
    if (!srcCanvas) return;

    display.width = srcCanvas.width;
    display.height = srcCanvas.height;
    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, display.width, display.height);

    if (compareMode) {
      const bitmap = bitmapRegistry.get(activeImageId);
      const splitX = Math.round(display.width * (sliderPos / 100));

      if (bitmap) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, display.height);
        ctx.clip();
        ctx.drawImage(bitmap, 0, 0);
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, display.width - splitX, display.height);
      ctx.clip();
      ctx.drawImage(srcCanvas, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(srcCanvas, 0, 0);
    }
  }, [activeImageId, compareMode, sliderPos]);

  useEffect(() => {
    draw();
  }, [draw, activeImage?.previewUrl]);

  useEffect(() => {
    setSliderPos(50);
  }, [activeImageId, compareMode]);

  useEffect(() => {
    if (!activeImage || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const fitZoom = Math.min(
      (cw - 48) / activeImage.width,
      (ch - 48) / activeImage.height,
      1
    );
    onZoomChange(fitZoom);
  }, [activeImage?.id, activeImage?.width, activeImage?.height]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    onZoomChange(Math.max(0.1, Math.min(4, zoom + delta)));
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!compareMode) return;
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const canvas = displayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setSliderPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    },
    [compareMode]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const canvas = displayRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setSliderPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!blemishMode || !activeImageId || !activeImage || compareMode) return;
      const canvas = displayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const normalizedX = (e.clientX - rect.left) / rect.width;
      const normalizedY = (e.clientY - rect.top) / rect.height;
      const normalizedRadius = blemishRadius / activeImage.width;
      addBlemishSpot(activeImageId, normalizedX, normalizedY, normalizedRadius);
    },
    [blemishMode, activeImageId, activeImage, compareMode, blemishRadius, addBlemishSpot]
  );

  if (!activeImage) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm font-mono">no image selected</p>
      </div>
    );
  }

  const spots = activeImage.settings.blemishRemoval.spots;

  return (
    <div
      ref={containerRef}
      className="flex-1 checkerboard relative overflow-hidden flex items-center justify-center"
      onWheel={handleWheel}
    >
      <div className="absolute top-3 right-3 z-10 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-md px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
        {Math.round(zoom * 100)}%
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-md px-3 py-1 font-mono text-xs text-[var(--text-muted)]">
        {activeImage.width} × {activeImage.height}
      </div>

      <div
        className="relative shadow-2xl"
        style={{
          width: activeImage.width,
          height: activeImage.height,
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          cursor: compareMode ? "ew-resize" : blemishMode ? "crosshair" : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <canvas
          ref={displayRef}
          style={{ imageRendering: zoom > 2 ? "pixelated" : "auto", display: "block" }}
        />

        {blemishMode && spots.map((spot, i) => {
          const r = Math.max(3, Math.round(spot.radius * activeImage.width));
          const diameter = r * 2;
          return (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full border-2 border-white/70"
              style={{
                left: spot.x * activeImage.width - r,
                top: spot.y * activeImage.height - r,
                width: diameter,
                height: diameter,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
              }}
            />
          );
        })}

        {compareMode && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-10"
              style={{
                left: `${sliderPos}%`,
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              }}
            />
            <div
              className="absolute top-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none z-20"
              style={{ left: `${sliderPos}%`, transform: "translate(-50%, -50%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3.5L2 8l3 4.5M11 3.5l3 4.5-3 4.5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="absolute top-3 left-3 pointer-events-none z-10">
              <span className="bg-black/50 text-white text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase">before</span>
            </div>
            <div className="absolute top-3 right-3 pointer-events-none z-10">
              <span className="bg-black/50 text-white text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase">after</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
