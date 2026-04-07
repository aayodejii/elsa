"use client";

import { useEditorStore } from "@/store/editorStore";
import { computeAutoEnhanceSettings } from "@/lib/ai/autoEnhance";
import { useCallback, useState } from "react";
import ExportDialog from "./ExportDialog";

interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showBatch: boolean;
  onToggleBatch: () => void;
}

export default function Toolbar({ onZoomIn, onZoomOut, onZoomFit, showSidebar, onToggleSidebar, showBatch, onToggleBatch }: ToolbarProps) {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const images = useEditorStore((s) => s.images);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const resetImage = useEditorStore((s) => s.resetImage);
  const compareMode = useEditorStore((s) => s.compareMode);
  const setCompareMode = useEditorStore((s) => s.setCompareMode);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const activeImage = images.find((i) => i.id === activeImageId);

  const canUndo = activeImage ? activeImage.historyIndex > 0 : false;
  const canRedo = activeImage
    ? activeImage.historyIndex < activeImage.settingsHistory.length - 1
    : false;

  const [showExport, setShowExport] = useState(false);

  const handleAutoEnhance = useCallback(() => {
    if (!activeImageId) return;
    const settings = computeAutoEnhanceSettings(activeImageId);
    if (settings) updateSettings(activeImageId, settings);
  }, [activeImageId, updateSettings]);

  const iconBtn =
    "w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <>
    <header
      className="flex items-center h-11 px-4 border-b shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
          <span className="text-[var(--bg-base)] text-xs font-bold">E</span>
        </div>
        <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
          elsa
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Undo */}
        <button
          className={iconBtn}
          onClick={() => activeImageId && undo(activeImageId)}
          disabled={!canUndo}
          title="Undo"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 .75-3.69" />
          </svg>
        </button>

        {/* Redo */}
        <button
          className={iconBtn}
          onClick={() => activeImageId && redo(activeImageId)}
          disabled={!canRedo}
          title="Redo"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-.75-3.69" />
          </svg>
        </button>

        <div className="w-px h-5 bg-[var(--border-strong)] mx-1" />

        {/* Compare */}
        <button
          className={`${iconBtn} ${compareMode ? "text-accent bg-[var(--bg-surface)]" : ""}`}
          onClick={() => setCompareMode(!compareMode)}
          disabled={!activeImageId}
          title="Before / after"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </button>

        {/* Auto-enhance */}
        <button
          className={iconBtn}
          onClick={handleAutoEnhance}
          disabled={!activeImageId}
          title="Auto-enhance"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
            <path d="M5 16l1 3 3-1-1-3-3 1z" />
            <path d="M18 14l1 3 3-1-1-3-3 1z" />
          </svg>
        </button>

        {/* Reset */}
        <button
          className={iconBtn}
          onClick={() => activeImageId && resetImage(activeImageId)}
          disabled={!activeImageId}
          title="Reset image"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Panel toggles — visible on small screens */}
      <div className="flex items-center gap-1 mr-2 lg:hidden">
        <button
          className={`${iconBtn} ${showSidebar ? "text-accent" : ""}`}
          onClick={onToggleSidebar}
          title="Toggle tools panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
          </svg>
        </button>
        <button
          className={`${iconBtn} ${showBatch ? "text-accent" : ""}`}
          onClick={onToggleBatch}
          title="Toggle photos panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" />
          </svg>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 mr-3">
        <button className={iconBtn} onClick={onZoomOut} title="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <button
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-1"
          onClick={onZoomFit}
        >
          fit
        </button>
        <button className={iconBtn} onClick={onZoomIn} title="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
      </div>

      {/* Download */}
      <button
        onClick={() => setShowExport(true)}
        disabled={!activeImageId}
        className={`
          flex items-center gap-2 h-7 px-3 rounded-lg text-xs font-semibold
          bg-accent text-[var(--bg-base)] hover:bg-[var(--accent-dim)]
          transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
        `}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        export
      </button>
    </header>

    {showExport && activeImage && (
      <ExportDialog image={activeImage} onClose={() => setShowExport(false)} />
    )}
    </>
  );
}
