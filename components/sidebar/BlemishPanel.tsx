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

export default function BlemishPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const clearBlemishSpots = useEditorStore((s) => s.clearBlemishSpots);
  const blemishMode = useEditorStore((s) => s.blemishMode);
  const blemishRadius = useEditorStore((s) => s.blemishRadius);
  const setBlemishMode = useEditorStore((s) => s.setBlemishMode);
  const setBlemishRadius = useEditorStore((s) => s.setBlemishRadius);
  const activeImage = useEditorStore((s) => s.images.find((i) => i.id === s.activeImageId));

  const br = activeImage?.settings.blemishRemoval;

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  const spotCount = br!.spots.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-primary)]">Blemish heal</span>
        <Toggle
          enabled={br!.enabled}
          onToggle={() =>
            updateSettings(activeImageId!, { blemishRemoval: { ...br!, enabled: !br!.enabled } })
          }
        />
      </div>

      <div className={`flex flex-col gap-3 transition-opacity ${br!.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Brush radius</label>
          <span className="font-mono text-xs text-accent tabular-nums">{blemishRadius}px</span>
        </div>
        <input
          type="range"
          min={5}
          max={80}
          value={blemishRadius}
          onChange={(e) => setBlemishRadius(Number(e.target.value))}
        />

        <div className="h-px bg-[var(--border)]" />

        <button
          onClick={() => setBlemishMode(!blemishMode)}
          className={`w-full py-2 rounded-md text-xs font-semibold font-mono transition-colors ${
            blemishMode
              ? "bg-accent text-white"
              : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)]"
          }`}
        >
          {blemishMode ? "click canvas to heal" : "activate heal tool"}
        </button>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {spotCount} spot{spotCount !== 1 ? "s" : ""} marked
          </span>
          {spotCount > 0 && (
            <button
              onClick={() => clearBlemishSpots(activeImageId!)}
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
