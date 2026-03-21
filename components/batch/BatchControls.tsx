"use client";

import { useBatchStore } from "@/store/batchStore";
import { useEditorStore } from "@/store/editorStore";

interface BatchControlsProps {
  onProcessAll: () => void;
  onDownloadAll: () => void;
}

export default function BatchControls({ onProcessAll, onDownloadAll }: BatchControlsProps) {
  const { isProcessingAll, totalCount, doneCount } = useBatchStore();
  const imageCount = useEditorStore((s) => s.images.length);

  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <div className="px-3 py-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
      {isProcessingAll && (
        <div className="flex flex-col gap-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {doneCount}/{totalCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-0.5 w-full bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onProcessAll}
        disabled={imageCount === 0 || isProcessingAll}
        className="w-full h-7 rounded-lg text-xs font-semibold bg-accent text-[var(--bg-base)] hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isProcessingAll ? "processing…" : "process all"}
      </button>

      <button
        onClick={onDownloadAll}
        disabled={imageCount === 0}
        className="w-full h-7 rounded-lg text-xs font-medium border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        download zip
      </button>
    </div>
  );
}
