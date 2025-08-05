import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute: Rendering. User:', user ? 'exists' : 'null', 'Loading:', loading);

  if (loading) {
    console.log('PrivateRoute: Loading is true, showing spinner.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando DoctorSoft...</p>
      </div>
    );
  }

  if (!user) {
    console.log('PrivateRoute: User is null, redirecting to login.');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  console.log('PrivateRoute: User exists and not loading, rendering children.');
  return <>{children}</>;
}
