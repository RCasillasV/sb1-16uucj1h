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

// Cache para el rol del usuario
let cachedUserRole: { userId: string; role: string | null; timestamp: number } | null = null;
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider component rendering'); // Añadir esta línea
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch user role from tcUsuarios
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    console.log('fetchUserRole called for userId:', userId);
    // Verificar caché primero
    if (cachedUserRole && 
        cachedUserRole.userId === userId && 
        Date.now() - cachedUserRole.timestamp < ROLE_CACHE_DURATION) {
      console.log('AuthContext: Using cached user role:', cachedUserRole.role);
      return cachedUserRole.role;
    }

    try {
      console.log('Attempting to fetch role from tcUsuarios table for userId:', userId);

      // Crea una promesa que se rechaza después de un tiempo de espera
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timed out')), 10000) // 10 segundos de tiempo de espera
      );

      // Compite la consulta de Supabase contra el tiempo de espera
      const { data, error } = await Promise.race([
        supabase.from('tcUsuarios').select('rol').eq('idusuario', userId).limit(1),
        timeoutPromise
      ]);

      console.log('Supabase query for user role completed.'); // Este log debería aparecer si la promesa se resuelve

      if (error) {
        console.error('Error fetching user role from tcUsuarios:', error);
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);
        return null;
      }
      
      // Si no se encontraron datos (ej. por RLS o usuario no existente)
      if (!data || data.length === 0) {
        console.warn('No user role found for userId:', userId, 'or RLS prevented access.');
        return null;
      }

      const role = data[0].rol || null; // Accede al primer elemento del array
      console.log('Rol del usuario fetched successfully:', role);
      
      // Guardar en caché
      cachedUserRole = {
        userId,
        role,
        timestamp: Date.now()
      };
      
      console.log('AuthContext: Fetched and cached user role:', role);
      return role;
    } catch (error) {
      console.error('Unexpected error in fetchUserRole catch block:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and set the user with role
    const checkSessionAndSetUser = async () => {
      console.log('checkSessionAndSetUser called');
      try {
        console.log('Calling supabase.auth.getSession()');
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
          console.log('Session user exists:', session.user.id);
          try {
            const userRole = await fetchUserRole(session.user.id);
            console.log('User role obtained from checkSessionAndSetUser:', userRole);
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Error fetching user role in checkSessionAndSetUser:', roleError);
            setUser(session.user);
          }
        } else {
          console.log('No session user found in checkSessionAndSetUser.');
          setUser(null);
        }
      } catch (error) {
        console.error('Error during supabase.auth.getSession() in checkSessionAndSetUser:', error);
        setUser(null);
      } finally {
        console.log('checkSessionAndSetUser finally block entered.');
        console.log('setLoading(false) executed in checkSessionAndSetUser finally block.');
        setLoading(false);
      }
    };
    checkSessionAndSetUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, 'Session:', session);
      try {
        if (session?.user) {
          console.log('Auth state change: Session user exists:', session.user.id);
          try {
            const userRole = await fetchUserRole(session.user.id);
            console.log('Auth state change: User role obtained:', userRole);
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Auth state change: Error fetching user role:', roleError);
            setUser(session.user);
          }
        } else {
          console.log('Auth state change: No session user found.');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change: Error in auth state change handler:', error);
        setUser(null);
      } finally {
        console.log('onAuthStateChange finally block entered.');
        console.log('Auth state change: setLoading(false) executed in finally block.');
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