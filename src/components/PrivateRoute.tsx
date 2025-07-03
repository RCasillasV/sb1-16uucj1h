import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  //console.log('PrivateRoute component rendering'); // Añadir esta línea
  const { user, loading } = useAuth();
  const location = useLocation();

  //console.log('PrivateRoute - user:', user, 'loading:', loading); // Añadir esta línea

  if (loading) {
    //console.log('PrivateRoute - Loading, showing spinner.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando DoctorSoft...</p>
      </div>
    );
  }

  if (!user) {
    console.log('PrivateRoute - User not authenticated, redirecting to login.');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
