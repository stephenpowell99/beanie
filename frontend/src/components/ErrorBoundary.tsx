import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error && this.state.error.toString()}
          </p>
          <details className="mt-2 text-sm bg-white p-3 rounded border">
            <summary className="cursor-pointer text-gray-700 font-medium">
              Technical Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-800 overflow-auto max-h-60">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
