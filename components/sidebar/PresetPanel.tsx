"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { PRESETS, Preset, loadCustomPresets, saveCustomPresets } from "@/lib/presets";

function PresetCard({
  preset,
  active,
  disabled,
  onApply,
  onDelete,
}: {
  preset: Preset;
  active: boolean;
  disabled: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onApply}
        disabled={disabled}
        className={`w-full flex flex-col gap-1 p-2.5 rounded-lg border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          active
            ? "border-[var(--border-accent)] bg-[var(--bg-surface-2)]"
            : "border-[var(--border-strong)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-surface-2)]"
        }`}
      >
        <div className="flex items-center gap-2 pr-3">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: preset.color, boxShadow: active ? `0 0 6px ${preset.color}80` : "none" }}
          />
          <span className={`text-xs font-semibold truncate ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
            {preset.name}
          </span>
          {active && (
            <span className="ml-auto shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)] leading-tight">{preset.description}</span>
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all z-10"
          title="Delete preset"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function PresetPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const images = useEditorStore((s) => s.images);

  const [customPresets, setCustomPresets] = useState<Preset[]>(() => loadCustomPresets());
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const activeImage = images.find((i) => i.id === activeImageId);

  useEffect(() => {
    setActivePresetId(null);
  }, [activeImageId]);

  const apply = (preset: Preset) => {
    if (!activeImageId) return;
    const { background: _, ...rest } = preset.settings;
    updateSettings(activeImageId, rest);
    setActivePresetId(preset.id);
  };

  const handleSave = () => {
    if (!savingName.trim() || !activeImage) return;
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: savingName.trim(),
      description: "Custom",
      color: "#22d3ee",
      settings: structuredClone(activeImage.settings),
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setSavingName("");
    setShowSaveInput(false);
  };

  const deleteCustom = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            active={activePresetId === preset.id}
            disabled={!activeImageId}
            onApply={() => apply(preset)}
          />
        ))}
      </div>

      {customPresets.length > 0 && (
        <>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] pt-1">saved</p>
          <div className="grid grid-cols-2 gap-2">
            {customPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                active={activePresetId === preset.id}
                disabled={!activeImageId}
                onApply={() => apply(preset)}
                onDelete={() => deleteCustom(preset.id)}
              />
            ))}
          </div>
        </>
      )}

      {showSaveInput ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setShowSaveInput(false); setSavingName(""); }
            }}
            placeholder="preset name..."
            autoFocus
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-accent)]"
          />
          <button onClick={handleSave} disabled={!savingName.trim()} className="text-xs font-semibold text-accent disabled:opacity-40">
            save
          </button>
          <button onClick={() => { setShowSaveInput(false); setSavingName(""); }} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveInput(true)}
          disabled={!activeImageId}
          className="w-full flex items-center gap-1.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          save current as preset
        </button>
      )}
    </div>
  );
}
