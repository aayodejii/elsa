"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useEditorStore } from "@/store/editorStore";

export default function DropZone() {
  const addImages = useEditorStore((s) => s.addImages);

  const onDrop = useCallback(
    (accepted: File[]) => {
      addImages(accepted);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".tiff"] },
    multiple: true,
  });

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        {...getRootProps()}
        className={`
          relative w-full max-w-xl h-72 rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-5 cursor-pointer
          transition-all duration-300 group
          ${
            isDragActive
              ? "border-accent bg-accent/5 scale-[1.02]"
              : "border-[var(--border-strong)] hover:border-accent/50 hover:bg-white/[0.02]"
          }
        `}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${isDragActive ? "bg-accent/20 scale-110" : "bg-[var(--bg-surface)] group-hover:bg-[var(--bg-surface-2)]"}
          `}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-colors duration-300 ${isDragActive ? "text-accent" : "text-[var(--text-secondary)]"}`}
          >
            <path
              d="M4 16L8 12L12 16M8 12V20M16 12L12 8L8 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 16.5C20 18.43 18.43 20 16.5 20H7.5C5.57 20 4 18.43 4 16.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 6v4M14 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p
            className={`font-semibold text-base transition-colors duration-200 ${
              isDragActive ? "text-accent" : "text-[var(--text-primary)]"
            }`}
          >
            {isDragActive ? "Drop to import" : "Drop photos here"}
          </p>
          <p className="text-sm text-[var(--text-secondary)] font-mono">
            or <span className="text-accent underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-2">
            JPG · PNG · WEBP · TIFF · multiple files supported
          </p>
        </div>

        {/* Corner accents */}
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
          <span
            key={pos}
            className={`absolute w-4 h-4 border-accent transition-opacity duration-300 ${
              isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            } ${pos === "top-left" ? "top-3 left-3 border-t-2 border-l-2" : ""}
               ${pos === "top-right" ? "top-3 right-3 border-t-2 border-r-2" : ""}
               ${pos === "bottom-left" ? "bottom-3 left-3 border-b-2 border-l-2" : ""}
               ${pos === "bottom-right" ? "bottom-3 right-3 border-b-2 border-r-2" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
