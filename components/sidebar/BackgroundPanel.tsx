"use client";

import { useEditorStore } from "@/store/editorStore";

const MODES = [
  { value: "none", label: "Original" },
  { value: "remove", label: "Remove" },
  { value: "blur", label: "Blur" },
  { value: "color", label: "Color" },
  { value: "gradient", label: "Gradient" },
] as const;

export default function BackgroundPanel() {
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const activeImage = useEditorStore((s) =>
    s.images.find((i) => i.id === s.activeImageId)
  );

  const bg = activeImage?.settings.background;

  if (!activeImage) {
    return <p className="text-xs text-[var(--text-muted)] font-mono">no image loaded</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--bg-surface)]">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() =>
              updateSettings(activeImageId!, {
                background: { ...bg!, mode: m.value },
              })
            }
            className={`py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              bg!.mode === m.value
                ? "bg-accent text-[var(--bg-base)] shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Blur radius */}
      {bg!.mode === "blur" && (
        <div className="flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Blur radius</label>
            <span className="font-mono text-xs text-accent tabular-nums">{bg!.blurRadius}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={bg!.blurRadius}
            onChange={(e) =>
              updateSettings(activeImageId!, {
                background: { ...bg!, blurRadius: Number(e.target.value) },
              })
            }
          />
        </div>
      )}

      {/* Solid color fill */}
      {bg!.mode === "color" && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Fill color</label>
            <span className="font-mono text-xs text-accent tabular-nums">{bg!.fillColor}</span>
          </div>
          <input
            type="color"
            value={bg!.fillColor}
            onChange={(e) =>
              updateSettings(activeImageId!, {
                background: { ...bg!, fillColor: e.target.value },
              })
            }
            className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
      )}

      {/* Gradient fill */}
      {bg!.mode === "gradient" && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Start</label>
              <input
                type="color"
                value={bg!.gradientStart}
                onChange={(e) =>
                  updateSettings(activeImageId!, {
                    background: { ...bg!, gradientStart: e.target.value },
                  })
                }
                className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">End</label>
              <input
                type="color"
                value={bg!.gradientEnd}
                onChange={(e) =>
                  updateSettings(activeImageId!, {
                    background: { ...bg!, gradientEnd: e.target.value },
                  })
                }
                className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Angle</label>
              <span className="font-mono text-xs text-accent tabular-nums">{bg!.gradientAngle}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={bg!.gradientAngle}
              onChange={(e) =>
                updateSettings(activeImageId!, {
                  background: { ...bg!, gradientAngle: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      )}

      {bg!.mode === "remove" && (
        <p className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed animate-fade-in">
          exports as png to preserve transparency
        </p>
      )}
    </div>
  );
}
