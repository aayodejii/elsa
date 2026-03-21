"use client";

import { useEditorStore } from "@/store/editorStore";

export default function SkinRetouchPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  const sr = activeImage?.settings.skinRetouch;

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Enable</span>
        <button
          onClick={() =>
            updateSettings(activeImageId!, {
              skinRetouch: { ...sr!, enabled: !sr!.enabled },
            })
          }
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
            sr!.enabled ? "bg-accent" : "bg-[var(--bg-surface-2)]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              sr!.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Strength */}
      <div className={`flex flex-col gap-1.5 transition-opacity ${sr!.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Smoothing</label>
          <span className="font-mono text-xs text-accent tabular-nums">{sr!.strength}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sr!.strength}
          onChange={(e) =>
            updateSettings(activeImageId!, {
              skinRetouch: { ...sr!, strength: Number(e.target.value) },
            })
          }
        />
      </div>

      <p className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
        detects face landmarks and applies edge-preserving skin smoothing
      </p>
    </div>
  );
}
