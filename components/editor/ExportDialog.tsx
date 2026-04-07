"use client";

import { useState, useEffect } from "react";
import type { ImageItemState } from "@/store/editorStore";
import { downloadSingle, type ExportOptions } from "@/lib/zip/batchExport";

interface ExportDialogProps {
  image: ImageItemState;
  onClose: () => void;
}

export default function ExportDialog({ image, onClose }: ExportDialogProps) {
  const [quality, setQuality] = useState(88);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [lockAspect, setLockAspect] = useState(true);

  const isPng = image.settings.background.mode === "remove";
  const origW = image.width;
  const origH = image.height;
  const aspectRatio = origH > 0 ? origW / origH : 1;

  useEffect(() => {
    const es = image.settings.exportSettings;
    setQuality(es.jpegQuality);
    setWidth(es.outputWidth);
    setHeight(es.outputHeight);
  }, [image.id, image.settings.exportSettings]);

  const handleWidthChange = (v: number | null) => {
    setWidth(v);
    if (lockAspect) setHeight(v !== null ? Math.round(v / aspectRatio) : null);
  };

  const handleHeightChange = (v: number | null) => {
    setHeight(v);
    if (lockAspect) setWidth(v !== null ? Math.round(v * aspectRatio) : null);
  };

  const handleDownload = async () => {
    const opts: ExportOptions = { jpegQuality: quality, outputWidth: width, outputHeight: height };
    await downloadSingle(image, opts);
    onClose();
  };

  const inputCls =
    "w-full bg-[var(--bg-surface)] rounded-md px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-xl border p-5 flex flex-col gap-5"
        style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Export</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              isPng ? "bg-blue-500/10 text-blue-400" : "bg-accent/10 text-accent"
            }`}
          >
            {isPng ? "PNG" : "JPEG"}
          </span>
        </div>

        {/* Quality */}
        <div className={`flex flex-col gap-1.5 ${isPng ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Quality</label>
            <span className="font-mono text-xs text-accent tabular-nums">{quality}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </div>

        {/* Dimensions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Dimensions</label>
            <button
              onClick={() => setLockAspect((v) => !v)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                lockAspect
                  ? "bg-accent/10 text-accent"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {lockAspect ? "locked" : "free"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-0.5">
              <input
                type="number"
                placeholder={String(origW)}
                value={width ?? ""}
                min={1}
                max={8000}
                onChange={(e) => handleWidthChange(e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
              <span className="text-[10px] text-[var(--text-muted)] font-mono">W</span>
            </div>
            <span className="text-[var(--text-muted)] text-xs pb-4">×</span>
            <div className="flex-1 flex flex-col gap-0.5">
              <input
                type="number"
                placeholder={String(origH)}
                value={height ?? ""}
                min={1}
                max={8000}
                onChange={(e) => handleHeightChange(e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
              <span className="text-[10px] text-[var(--text-muted)] font-mono">H</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">
            original: {origW} × {origH}px
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
          >
            cancel
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-accent text-[var(--bg-base)] hover:bg-[var(--accent-dim)] transition-colors"
          >
            download
          </button>
        </div>
      </div>
    </div>
  );
}
