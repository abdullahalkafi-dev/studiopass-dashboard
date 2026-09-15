"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Dashboard ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <AlertTriangle size={32} className="text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-foreground">Dashboard Error</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Something went wrong loading the dashboard. Please try refreshing the page.
          </p>
          {this.state.error && (
            <p className="text-[11px] text-muted-foreground/60 mt-2 font-mono max-w-lg break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#0092D8] transition-colors"
          >
            <RefreshCw size={14} />
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
