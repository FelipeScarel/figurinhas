"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl">&#9888;</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs">
            Não foi possível carregar o modelo 3D.
          </p>
          <p className="text-muted-foreground/50 text-xs max-w-xs">
            Verifique sua conexão e recarregue a página.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
