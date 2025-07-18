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
  //console.log('AuthProvider component rendering'); // Añadir esta línea
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
      } else {
        // console.log('Rol del usuario:', data.rol); // Añadir esta línea
      }
      return data?.rol || null;
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and set the user with role
    const checkSessionAndSetUser = async () => {
      //console.log('checkSessionAndSetUser called');
      try {
        //console.log('Calling supabase.auth.getSession()');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        const { session } = data;
        //console.log('Session data received:', session);
        
        if (session?.user) {
          // console.log('Session user exists:', session.user);
          try {
            const userRole = await fetchUserRole(session.user.id);
            //console.log('User role fetched:', userRole);
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
            setUser(session.user);
          }
        } else {
          console.log('No session user found.');
          setUser(null);
        }
      } catch (error) {
        console.error('Error during supabase.auth.getSession():', error); 
        setUser(null);
      } finally {
        setLoading(false);
        //console.log('setLoading(false) executed in checkSessionAndSetUser finally block.');
      }
    };
    checkSessionAndSetUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      //console.log('Auth state changed:', _event, 'Session:', session);
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
        if (error.message.includes('session') || error.message.includes('Refresh Token') || error.message.includes('Invalid Refresh Token')) {
          console.warn('Auth error during signOut, likely invalid session. Clearing local storage and redirecting.');
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('supabase.auth.refreshToken');
          // Clear any Supabase auth keys from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.auth.')) {
              localStorage.removeItem(key);
            }
          });
          navigate('/login', {
            state: { message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.' }
          });
          return { error: null };
        }
        throw error;
      }
      
      // Clear any local storage data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('supabase.auth.refreshToken');
      // Clear any Supabase auth keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset context state
      setUser(null);
      
      // Redirect to login
      navigate('/login', { 
        state: { message: 'Sesión cerrada exitosamente' }
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear all auth data and redirect to login with appropriate message
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('supabase.auth.refreshToken');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      setUser(null);
      navigate('/login', {
        state: { message: 'La sesión ha sido cerrada debido a un error inesperado.' }
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