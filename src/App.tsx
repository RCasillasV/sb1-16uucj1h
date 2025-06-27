import React, { useEffect, lazy, Suspense } from 'react';
import LogoutTestPage from './pages/LogoutTestPage'; // Asegúrate de que la ruta sea correcta


function App() {
  return (
    <div style={{ backgroundColor: 'lightblue', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>¡Hola, DoctorSoft!</h1>
      {/* Aquí agregas el componente LogoutTestPage */}
      <LogoutTestPage />
    </div>
  );
}

export default App;