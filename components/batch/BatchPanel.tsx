"use client";

import { useEditorStore } from "@/store/editorStore";
import BatchThumbnail from "./BatchThumbnail";
import BatchControls from "./BatchControls";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface BatchPanelProps {
  onProcessAll: () => void;
  onDownloadAll: () => void;
}

export default function BatchPanel({ onProcessAll, onDownloadAll }: BatchPanelProps) {
  const images = useEditorStore((s) => s.images);
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const setActiveImage = useEditorStore((s) => s.setActiveImage);
  const addImages = useEditorStore((s) => s.addImages);
  const removeImage = useEditorStore((s) => s.removeImage);

  const onDrop = useCallback(
    (files: File[]) => addImages(files),
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    noClick: true,
  });

  return (
    <aside
      {...getRootProps()}
      className="w-56 flex flex-col border-l shrink-0 relative"
      style={{
        background: "var(--bg-panel)",
        borderColor: isDragActive ? "var(--border-accent)" : "var(--border)",
        transition: "border-color 0.15s",
      }}
    >
      <input {...getInputProps()} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </p>
        {/* Add more button */}
        <label className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--bg-surface)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && addImages(Array.from(e.target.files))}
          />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </label>
      </div>

      {/* Thumbnail grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <p className="text-[11px] font-mono text-[var(--text-muted)] text-center leading-relaxed">
              drop photos here<br />to add more
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {images.map((img) => (
              <div key={img.id} className="relative group/thumb">
                <BatchThumbnail
                  image={img}
                  isActive={img.id === activeImageId}
                  onClick={() => setActiveImage(img.id)}
                />
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all hidden group-hover/thumb:flex"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-accent/5 border-2 border-accent rounded pointer-events-none flex items-center justify-center">
          <p className="text-xs font-semibold text-accent">drop to add</p>
        </div>
      )}

      <BatchControls onProcessAll={onProcessAll} onDownloadAll={onDownloadAll} />
    </aside>
  );
}
