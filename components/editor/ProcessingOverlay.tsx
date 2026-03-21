"use client";

import { useEditorStore } from "@/store/editorStore";

export default function ProcessingOverlay() {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const progress = useEditorStore((s) => s.processingProgress);

  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="flex flex-col items-center gap-4 rounded-2xl p-8"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-accent)" }}
      >
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--bg-surface-2)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          <div
            className="absolute inset-2 rounded-full animate-pulse-accent"
            style={{ background: "var(--accent-glow)" }}
          />
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center gap-2 w-40">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            processing
          </p>
          <div className="w-full h-1 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-xs text-[var(--text-secondary)]">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
