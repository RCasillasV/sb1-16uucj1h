import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { User, AuthError } from '@supabase/supabase-js';

type UserWithAttributes = User & {
  userRole?: string | null;
  idbu?: string | null;
  nombre?: string | null;
  estado?: string | null;
  deleted_at?: string | null;
};

interface AuthContextType {
  user: UserWithAttributes | null;
  loading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider component rendering'); // Añadir esta línea
  const [user, setUser] = useState<UserWithAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  console.log('AuthProvider: current user state:', user, 'loading state:', loading); // <-- Añade esta línea 

  // Function to introduce a small delay
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to fetch user attributes using centralized API
  const fetchUserAttributes = async (userId: string): Promise<Partial<UserWithAttributes>> => {
    console.log('fetchUserAttributes called for userId:', userId);
    
    try {
      // Use centralized API function
      const userAttributes = await api.users.getCurrentUserAttributes(userId);
      
      if (userAttributes) {
        console.log('AuthContext: Fetched user attributes successfully:', userAttributes);
        return {
          idbu: userAttributes.idbu,
          nombre: userAttributes.nombre,
          userRole: userAttributes.rol,
          estado: userAttributes.estado,
          deleted_at: userAttributes.deleted_at
        };
      }
      
      // No user attributes found, use defaults
      console.warn('AuthContext: No user attributes found, using defaults');
      return {
        idbu: null,
        nombre: null,
        userRole: 'Recepcionista',
        estado: 'Activo',
        deleted_at: null
      };
    } catch (error) {
      console.error('AuthContext: Error in fetchUserAttributes:', error);
      // Return defaults on error
      return {
        idbu: null,
        nombre: null,
        userRole: 'Recepcionista',
        estado: 'Activo',
        deleted_at: null
      };
    }
  };

  useEffect(() => {
    // Check active sessions and set the user with role
    const checkSessionAndSetUser = async () => {
      console.log('checkSessionAndSetUser called');
      setLoading(true); // Ensure loading is true at the very start

      // Introduce a small delay to allow localStorage to synchronize in new tabs
      await sleep(100); // Wait for 100ms
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
            const userAttributes = await fetchUserAttributes(session.user.id);
            console.log('User attributes obtained from checkSessionAndSetUser:', userAttributes);
            setUser({ ...session.user, ...userAttributes });
          } catch (attrError) {
            console.error('Error fetching user attributes in checkSessionAndSetUser:', attrError);
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
            const userAttributes = await fetchUserAttributes(session.user.id);
            console.log('Auth state change: User attributes obtained:', userAttributes);
            setUser({ ...session.user, ...userAttributes });
          } catch (attrError) {
            console.error('Auth state change: Error fetching user attributes:', attrError);
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
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando DoctorSoft...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth: context value:', context); 
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 