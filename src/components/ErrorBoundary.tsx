import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error monitoring service
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('eeu_user_id') // If available
    };

    // Store error in localStorage for later reporting
    try {
      const existingErrors = JSON.parse(localStorage.getItem('eeu_error_reports') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('eeu_error_reports', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return;
    }

    this.setState({ 
      isRetrying: true 
    });

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
    }, 1000);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportIssue = () => {
    const error = this.state.error;
    const errorInfo = this.state.errorInfo;
    
    const issueBody = encodeURIComponent(
      `Error Report from EEU CMS

**Error:** ${error?.name || 'Unknown Error'}
**Message:** ${error?.message || 'No message'}
**Component Stack:** ${errorInfo?.componentStack || 'Not available'}
**Timestamp:** ${new Date().toISOString()}
**Browser:** ${navigator.userAgent}
**URL:** ${window.location.href}

**Steps to reproduce:**
1. 
2. 
3. 

**Expected behavior:**

**Actual behavior:**
An error occurred and the application crashed.

**Additional context:**
`
    );

    // In a real app, this would open your issue tracking system
    window.open(
      `mailto:support@eeu.gov.et?subject=EEU CMS Error Report&body=${issueBody}`,
      '_blank'
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < 3;
      const error = this.state.error;
      const errorInfo = this.state.errorInfo;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <div className="p-8 text-center">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={eeuLogo} 
                  alt="EEU Logo" 
                  className="w-12 h-12 object-contain mr-4"
                />
                <div>
                  <h1 className="text-orange-500 font-semibold text-xl">EEU CMS</h1>
                  <p className="text-xs text-gray-600">Ethiopian Electric Utility</p>
                </div>
              </div>

              {/* Error Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-4">
                  We're sorry, but an unexpected error occurred. Our team has been notified.
                </p>
              </div>

              {/* Error Details (if enabled) */}
              {this.props.showDetails && error && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <details className="text-sm">
                    <summary className="font-medium text-gray-900 cursor-pointer mb-2">
                      Error Details
                    </summary>
                    <div className="space-y-2 text-gray-600">
                      <div>
                        <span className="font-medium">Error:</span> {error.name}
                      </div>
                      <div>
                        <span className="font-medium">Message:</span> {error.message}
                      </div>
                      {error.stack && (
                        <div>
                          <span className="font-medium">Stack:</span>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      {errorInfo?.componentStack && (
                        <div>
                          <span className="font-medium">Component Stack:</span>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-yellow-800 text-sm">
                    Retry attempts: {this.state.retryCount}/3
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="border-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset App
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-gray-300"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReportIssue}
                  variant="outline"
                  className="border-gray-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact our support team at{' '}
                  <a 
                    href="mailto:support@eeu.gov.et" 
                    className="text-orange-500 hover:text-orange-600"
                  >
                    support@eeu.gov.et
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}