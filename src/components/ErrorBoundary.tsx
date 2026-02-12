import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch DOM-related errors
    if (error.message.includes("removeChild") || error.message.includes("appendChild")) {
      return { hasError: true, error };
    }
    throw error; // Re-throw other errors
  }

  componentDidCatch(error: Error) {
    console.warn("Error Boundary caught:", error.message);
    // Don't log to console in production
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Silently recover from DOM errors - just render children normally
      return this.props.children;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
