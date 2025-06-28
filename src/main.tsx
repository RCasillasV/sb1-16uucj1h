import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Enable React concurrent features
const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}


// Clean up console in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}
