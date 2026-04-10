"use client";

import { useEditorStore } from "@/store/editorStore";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
        enabled ? "bg-accent" : "bg-[var(--bg-surface-2)]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function DarkCirclesPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  const dc = activeImage?.settings.darkCircles;
  const ws = activeImage?.settings.wrinkleSmooth;

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Dark circles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">Dark circles</span>
          <Toggle
            enabled={dc!.enabled}
            onToggle={() =>
              updateSettings(activeImageId!, { darkCircles: { ...dc!, enabled: !dc!.enabled } })
            }
          />
        </div>
        <div className={`flex flex-col gap-1.5 transition-opacity ${dc!.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Strength</label>
            <span className="font-mono text-xs text-accent tabular-nums">{dc!.strength}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={dc!.strength}
            onChange={(e) =>
              updateSettings(activeImageId!, { darkCircles: { ...dc!, strength: Number(e.target.value) } })
            }
          />
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Wrinkle smoothing */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">Wrinkle smooth</span>
          <Toggle
            enabled={ws!.enabled}
            onToggle={() =>
              updateSettings(activeImageId!, { wrinkleSmooth: { ...ws!, enabled: !ws!.enabled } })
            }
          />
        </div>
        <div className={`flex flex-col gap-1.5 transition-opacity ${ws!.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Strength</label>
            <span className="font-mono text-xs text-accent tabular-nums">{ws!.strength}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={ws!.strength}
            onChange={(e) =>
              updateSettings(activeImageId!, { wrinkleSmooth: { ...ws!, strength: Number(e.target.value) } })
            }
          />
        </div>
        <p className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
          forehead + nasolabial zones
        </p>
      </div>
    </div>
  );
}
