import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/react-query';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  console.error('Elemento raíz no encontrado');
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  // Use StrictMode only in development to avoid double renders in production
  const AppWrapper = import.meta.env.DEV ? StrictMode : React.Fragment;

  createRoot(root).render(
    <AppWrapper>
      <ErrorBoundary>
        <Router>
          <QueryClientProvider client={queryClient}>
            <React.Suspense fallback={
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Cargando DoctorSoft...</p>
              </div>
            }>
              <AuthProvider>
                <App />
              </AuthProvider>
            </React.Suspense>
          </QueryClientProvider>
        </Router>
      </ErrorBoundary>
    </AppWrapper>
  );
}