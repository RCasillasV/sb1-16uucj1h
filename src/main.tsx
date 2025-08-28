import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter> 
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}