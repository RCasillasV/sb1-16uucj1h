import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

function LogoutTestPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    // Automatically trigger logout after 3 seconds
    const timer = setTimeout(() => {
      signOut();
    }, 3000);

    return () => clearTimeout(timer);
  }, [signOut]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-4"
    >
      <h1 className="text-3xl font-bold mb-4">¡Hola, DoctorSoft!</h1>
      <p className="text-lg mb-8">Cerrando sesión automáticamente en 3 segundos...</p>
      <button 
        onClick={() => signOut()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Cerrar sesión ahora
      </button>
    </div>
  );
}

export default LogoutTestPage;