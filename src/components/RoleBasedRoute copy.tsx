// src/components/RoleBasedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    // Optionally, render a loading spinner or placeholder
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect to login
    //console.log(`Usuario no autenticado`);
    return <Navigate to="/login" replace />;
  }

  if (!user.userRole || !allowedRoles.includes(user.userRole)) {
      console.log(`Rol del Usuario ${user.userRole }`);
    // User is authenticated but does not have an allowed role, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}