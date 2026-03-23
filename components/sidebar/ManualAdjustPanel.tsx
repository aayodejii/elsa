"use client";

import { useEditorStore } from "@/store/editorStore";
import { EditorSettings } from "@/types/editor";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  showSign?: boolean;
}

function SliderRow({ label, value, min, max, onChange, showSign }: SliderRowProps) {
  const display = showSign && value > 0 ? `+${value}` : `${value}`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
        <span
          className={`font-mono text-xs tabular-nums w-10 text-right transition-colors ${
            value !== 0 ? "text-accent" : "text-[var(--text-muted)]"
          }`}
        >
          {display}
        </span>
      </div>
      <div className="relative flex items-center">
        {/* Center mark */}
        {min < 0 && (
          <div
            className="absolute w-px h-3 bg-[var(--border-strong)] pointer-events-none"
            style={{ left: "50%" }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default function ManualAdjustPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  const manual = activeImage?.settings.manual;

  const update = (key: keyof EditorSettings["manual"], value: number) => {
    if (!activeImageId) return;
    updateSettings(activeImageId, { manual: { ...manual!, [key]: value } });
  };

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SliderRow label="Brightness" value={manual!.brightness} min={-100} max={100} onChange={(v) => update("brightness", v)} showSign />
      <SliderRow label="Contrast" value={manual!.contrast} min={-100} max={100} onChange={(v) => update("contrast", v)} showSign />
      <SliderRow label="Saturation" value={manual!.saturation} min={-100} max={100} onChange={(v) => update("saturation", v)} showSign />
      <SliderRow label="Sharpness" value={manual!.sharpness} min={0} max={100} onChange={(v) => update("sharpness", v)} />
      <SliderRow label="Hue" value={manual!.hue} min={-180} max={180} onChange={(v) => update("hue", v)} showSign />

      <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3">color grading</p>
        <div className="flex flex-col gap-4">
          <SliderRow label="Temperature" value={manual!.temperature} min={-100} max={100} onChange={(v) => update("temperature", v)} showSign />
          <SliderRow label="Tint" value={manual!.tint} min={-100} max={100} onChange={(v) => update("tint", v)} showSign />
        </div>
      </div>

      <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3">tone</p>
        <div className="flex flex-col gap-4">
          <SliderRow label="Shadows" value={manual!.shadows} min={-100} max={100} onChange={(v) => update("shadows", v)} showSign />
          <SliderRow label="Midtones" value={manual!.midtones} min={-100} max={100} onChange={(v) => update("midtones", v)} showSign />
          <SliderRow label="Highlights" value={manual!.highlights} min={-100} max={100} onChange={(v) => update("highlights", v)} showSign />
        </div>
      </div>

      <button
        className="mt-1 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-left transition-colors"
        onClick={() => {
          if (!activeImageId) return;
          updateSettings(activeImageId, {
            manual: { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, hue: 0, temperature: 0, tint: 0, shadows: 0, midtones: 0, highlights: 0 },
          });
        }}
      >
        reset adjustments
      </button>
    </div>
  );
}
