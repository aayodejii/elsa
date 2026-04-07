"use client";

import { useEditorStore } from "@/store/editorStore";

export default function EffectsPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  const { vignette, grain } = activeImage.settings;

  return (
    <div className="flex flex-col gap-5">
      {/* Vignette */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Vignette</span>
          <button
            onClick={() =>
              updateSettings(activeImageId!, { vignette: { ...vignette, enabled: !vignette.enabled } })
            }
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              vignette.enabled ? "bg-accent" : "bg-[var(--bg-surface-2)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                vignette.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <div className={`flex flex-col gap-1.5 transition-opacity ${vignette.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Strength</label>
            <span className="font-mono text-xs text-accent tabular-nums">{vignette.strength}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={vignette.strength}
            onChange={(e) =>
              updateSettings(activeImageId!, { vignette: { ...vignette, strength: Number(e.target.value) } })
            }
          />
        </div>
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }} />

      {/* Grain */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Film Grain</span>
          <button
            onClick={() =>
              updateSettings(activeImageId!, { grain: { ...grain, enabled: !grain.enabled } })
            }
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              grain.enabled ? "bg-accent" : "bg-[var(--bg-surface-2)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                grain.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <div className={`flex flex-col gap-3 transition-opacity ${grain.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Amount</label>
              <span className="font-mono text-xs text-accent tabular-nums">{grain.strength}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={grain.strength}
              onChange={(e) =>
                updateSettings(activeImageId!, { grain: { ...grain, strength: Number(e.target.value) } })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Size</label>
              <span className="font-mono text-xs text-accent tabular-nums">{grain.size}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={grain.size}
              onChange={(e) =>
                updateSettings(activeImageId!, { grain: { ...grain, size: Number(e.target.value) } })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
