import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ShieldAlert } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto dark:bg-red-950/20">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected JavaScript error has occurred on this screen dashboard.
              </p>
              {this.state.error && (
                <pre className="p-3 bg-muted rounded-lg text-left text-[9px] font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <div className="pt-2">
              <Button className="w-full text-sm" onClick={this.handleReload}>
                Reload Application page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
