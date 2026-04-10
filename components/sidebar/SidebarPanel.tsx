"use client";

import { useState, ReactNode } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface AccordionSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

function AccordionSection({ title, icon, children, defaultOpen = false, badge }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors group"
      >
        <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
          {icon}
        </span>
        <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">
            {badge}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: open ? "1200px" : "0px" }}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}

interface SidebarPanelProps {
  presetPanel: ReactNode;
  skinRetouchPanel: ReactNode;
  freqSepPanel: ReactNode;
  backgroundPanel: ReactNode;
  faceEnhancePanel: ReactNode;
  darkCirclesPanel: ReactNode;
  manualAdjustPanel: ReactNode;
  effectsPanel: ReactNode;
  denoiserPanel: ReactNode;
}

export default function SidebarPanel({
  presetPanel,
  skinRetouchPanel,
  freqSepPanel,
  backgroundPanel,
  faceEnhancePanel,
  darkCirclesPanel,
  manualAdjustPanel,
  effectsPanel,
  denoiserPanel,
}: SidebarPanelProps) {
  return (
    <aside
      className="w-72 flex flex-col border-r overflow-y-auto shrink-0"
      style={{
        background: "var(--bg-panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          tools
        </p>
      </div>

      <AccordionSection
        title="Presets"
        defaultOpen
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      >
        {presetPanel}
      </AccordionSection>

      <AccordionSection
        title="Background"
        defaultOpen
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        }
        badge="ai"
      >
        <ErrorBoundary label="background">{backgroundPanel}</ErrorBoundary>
      </AccordionSection>

      <AccordionSection
        title="Skin"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M8 14s-2 1-2 4h12c0-3-2-4-2-4" />
          </svg>
        }
        badge="ai"
      >
        <ErrorBoundary label="skin">{skinRetouchPanel}</ErrorBoundary>
      </AccordionSection>

      <AccordionSection
        title="Freq. Separation"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M2 6c4 0 4 6 8 6s4-6 8-6M2 18c4 0 4-6 8-6s4 6 8 6" />
          </svg>
        }
        badge="ai"
      >
        <ErrorBoundary label="freq-sep">{freqSepPanel}</ErrorBoundary>
      </AccordionSection>

      <AccordionSection
        title="Face"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9 10h.01M15 10h.01M9.5 15.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
          </svg>
        }
        badge="ai"
      >
        <ErrorBoundary label="face">{faceEnhancePanel}</ErrorBoundary>
      </AccordionSection>

      <AccordionSection
        title="Retouch"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c-4.97 0-9-2.69-9-6 0-1.5.75-2.88 2-3.9" />
            <path d="M12 22c4.97 0 9-2.69 9-6 0-1.5-.75-2.88-2-3.9" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        }
        badge="ai"
      >
        <ErrorBoundary label="retouch">{darkCirclesPanel}</ErrorBoundary>
      </AccordionSection>

      <AccordionSection
        title="Effects"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        }
      >
        {effectsPanel}
      </AccordionSection>

      <AccordionSection
        title="Denoiser"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
            <path d="M7 3v18M17 3v18" strokeDasharray="2 2" />
          </svg>
        }
      >
        {denoiserPanel}
      </AccordionSection>

      <AccordionSection
        title="Adjustments"
        defaultOpen
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="8" cy="6" r="2" fill="currentColor" />
            <circle cx="16" cy="12" r="2" fill="currentColor" />
            <circle cx="10" cy="18" r="2" fill="currentColor" />
          </svg>
        }
      >
        {manualAdjustPanel}
      </AccordionSection>
    </aside>
  );
}
