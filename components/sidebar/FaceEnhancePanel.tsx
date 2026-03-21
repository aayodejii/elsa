"use client";

import { useEditorStore } from "@/store/editorStore";
import { EditorSettings } from "@/types/editor";

interface FeatureSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function FeatureSlider({ label, description, value, onChange, disabled }: FeatureSliderProps) {
  return (
    <div className={`flex flex-col gap-1.5 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">{description}</p>
        </div>
        <span className="font-mono text-xs text-accent tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function FaceEnhancePanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  const fe = activeImage?.settings.faceEnhance;

  const update = (patch: Partial<EditorSettings["faceEnhance"]>) => {
    if (!activeImageId) return;
    updateSettings(activeImageId, { faceEnhance: { ...fe!, ...patch } });
  };

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Enable</span>
        <button
          onClick={() => update({ enabled: !fe!.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
            fe!.enabled ? "bg-accent" : "bg-[var(--bg-surface-2)]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              fe!.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <FeatureSlider
        label="Brighten"
        description="soft-light on skin"
        value={fe!.brightness}
        onChange={(v) => update({ brightness: v })}
        disabled={!fe!.enabled}
      />
      <FeatureSlider
        label="Eyes"
        description="contrast + highlight"
        value={fe!.eyeEnhance}
        onChange={(v) => update({ eyeEnhance: v })}
        disabled={!fe!.enabled}
      />
      <FeatureSlider
        label="Teeth"
        description="selective whitening"
        value={fe!.teethWhiten}
        onChange={(v) => update({ teethWhiten: v })}
        disabled={!fe!.enabled}
      />
    </div>
  );
}
