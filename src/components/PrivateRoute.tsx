import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  console.log('PrivateRoute is rendering');
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

if (!user) {
  console.log('PrivateRoute: User is null, redirecting to /login'); // Añadir esta línea
  return <Navigate to="/login" replace state={{ from: location }} />;
}