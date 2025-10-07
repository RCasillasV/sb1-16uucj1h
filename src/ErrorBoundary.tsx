import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  resetKey: number; // Key to force remounting children
}

const MAX_RETRIES = 3; // Maximum number of retries for dynamic import errors

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      resetKey: 0, // Initial key
    };
  }

  static getDerivedStateFromError(error: Error): State | null {
    return {
      hasError: true,
      error,
      retryCount: 0, // Reset retry count for new errors caught by this static method
      resetKey: 0, // Reset key
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Check if it's a dynamic import error
    const isDynamicImportError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      (error.name === 'ChunkLoadError') || // Common Webpack/Vite error name
      (error instanceof TypeError && error.message.includes('Failed to fetch')); // Generic network error

    if (isDynamicImportError && this.state.retryCount < MAX_RETRIES) {
      console.log(`Attempting retry ${this.state.retryCount + 1}/${MAX_RETRIES} for dynamic import error.`);
      // If it's a dynamic import error and we have retries left,
      // increment retryCount and change the key to force remounting children.
      // This will cause the lazy import to be re-attempted.
  this.setState(prevState => ({
       hasError: false, // Clear error state to allow re-render
       error: null,
        retryCount: prevState.retryCount + 1,
        resetKey: prevState.resetKey + 1, // Change key to force remount
      }));
    } else {
      // For other errors or if retries are exhausted, set hasError to true
      // and display the persistent error message.
      this.setState({
        hasError: true,
        error,
        // retryCount and resetKey remain as they were, indicating no more retries
      });
     };
   }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-red-800 font-medium">Error: {this.state.error?.message || 'Error desconocido'}</p>
              {this.state.retryCount >= MAX_RETRIES && (
                <p className="text-red-800 font-medium mt-2">Se agotaron los intentos de reconexión automática.</p>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              Por favor, intenta recargar la página. Si el problema persiste, contacta al soporte técnico.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    // Render children with the key to force remount on retry
    return React.cloneElement(this.props.children as React.ReactElement, {
      key: this.state.resetKey,
    });
  }
}