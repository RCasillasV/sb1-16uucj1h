import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // ✅ Usar HashRouter aquí
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  console.error('Elemento raíz no encontrado');
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  createRoot(root).render(
    <StrictMode>
      <HashRouter> {/* ✅ Único Router */}
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </HashRouter>
    </StrictMode>
  );
}