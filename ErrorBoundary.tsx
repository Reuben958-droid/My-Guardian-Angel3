import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong in the sanctuary. Please try refreshing.";
      
      try {
        // Check if it's a Firestore JSON error
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `A spiritual connection error occurred during ${parsed.operationType}. Our angels are looking into it.`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-serif italic text-slate-200">Peace be with you</h2>
            <p className="text-slate-400 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-full transition-all uppercase tracking-widest text-xs"
            >
              Reconnect to Sanctuary
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
