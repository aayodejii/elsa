"use client";

import { ImageItemState } from "@/store/editorStore";

interface BatchThumbnailProps {
  image: ImageItemState;
  isActive: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-[var(--text-muted)]",
  processing: "bg-yellow-400 animate-pulse-accent",
  done: "bg-green-400",
  error: "bg-red-400",
};

export default function BatchThumbnail({ image, isActive, onClick }: BatchThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group rounded-lg overflow-hidden aspect-square
        transition-all duration-150
        ${isActive
          ? "ring-2 ring-accent ring-offset-1 ring-offset-[var(--bg-panel)]"
          : "ring-1 ring-[var(--border)] hover:ring-[var(--border-strong)]"
        }
      `}
    >
      {/* Thumbnail image */}
      <img
        src={image.thumbnail}
        alt={image.file.name}
        className="w-full h-full object-cover"
      />

      {/* Status dot */}
      <span
        className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${STATUS_COLORS[image.status]}`}
      />

      {/* Hover overlay with filename */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
        <p className="text-[10px] font-mono text-white truncate w-full text-left leading-tight">
          {image.file.name}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-accent/30" />
      )}
    </button>
  );
}
