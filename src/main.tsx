import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext'; // 👈 Importa el provider
import './index.css';

// Enable React concurrent features
const root = document.getElementById('root');
if (!root) {
  console.error('Elemento raíz no encontrado');
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter> 
        <ErrorBoundary>
          <AuthProvider> 
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </StrictMode>
  );
}

// Limpieza de consola en producción
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}