import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

type UserWithRole = User & { userRole?: string | null };

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch user role from tcUsuarios
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('rol')
        .eq('idusuario', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      console.log('Rol del usuario:', data?.rol);
      return data?.rol || null;
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      return null;
    }
  };

  // Function to fetch user role from tcUsuarios
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('rol')
        .eq('idusuario', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      } else {
        console.error('Rol del usuario:', data.rol);
      }
      return data?.rol || null;
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and set the user with role
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          try {
            const userRole = await fetchUserRole(session.user.id);
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        // Ensure loading is set to false regardless of success or failure
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          try {
            const userRole = await fetchUserRole(session.user.id);
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Error fetching user role on auth change:', roleError);
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        // Ensure loading is set to false regardless of success or failure
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No active session, just redirect to login
        navigate('/login', { 
          state: { message: 'La sesión ha expirado' }
        });
        return { error: null }; 
      }

      // If we have a session, proceed with sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // If error is session related, just redirect
        if (error.message.includes('session')) {
          navigate('/login', {
            state: { message: 'La sesión ha expirado' }
          });
          return { error: null };
        }
        throw error;
      }
      
      // Clear any local storage data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      // Reset context state
      setUser(null);
      
      // Redirect to login
      navigate('/login', { 
        state: { message: 'Sesión cerrada exitosamente' }
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      // Always redirect to login with appropriate message
      navigate('/login', {
        state: { message: 'La sesión ha sido cerrada' }
      });
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};