import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React render errors
 * Prevents entire app from crashing due to component errors
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ Error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8f9fa",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "40px",
            maxWidth: "500px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "20px",
            }}>
              ⚠️
            </div>

            <h1 style={{
              margin: "0 0 10px 0",
              fontSize: "24px",
              color: "#d32f2f",
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              margin: "0 0 20px 0",
              fontSize: "14px",
              color: "#666",
              lineHeight: "1.5",
            }}>
              The app encountered an unexpected error. Please try refreshing the page.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: "20px",
                textAlign: "left",
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#333",
              }}>
                <summary style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}>
                  Error Details
                </summary>
                <pre style={{
                  margin: "0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "11px",
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: "10px 24px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "500",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = "#1565c0";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = "#1976d2";
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
