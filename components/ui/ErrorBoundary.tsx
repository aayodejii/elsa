"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col gap-1.5 px-3 py-3">
          <p className="text-[11px] font-mono text-red-400/80">
            {this.props.label ?? "panel"} unavailable
          </p>
          <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed break-all">
            {this.state.error.message}
          </p>
          <button
            className="text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-left"
            onClick={() => this.setState({ error: null })}
          >
            retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
