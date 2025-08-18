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
    console.log('AuthContext: Starting fetchUserAttributes with userId:', userId);
    
    try {
      console.log('AuthContext: About to call api.users.getCurrentUserAttributes');
      // Use centralized API function
      const userAttributes = await api.users.getCurrentUserAttributes(userId);
      console.log('AuthContext: api.users.getCurrentUserAttributes returned:', userAttributes);
      
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
      console.log('AuthContext: Returning default user attributes');
      return {
        idbu: null,
        nombre: null,
        userRole: 'Recepcionista',
        estado: 'Activo',
        deleted_at: null
      };
    } catch (error) {
      console.error('AuthContext: Error in fetchUserAttributes:', error);
      console.log('AuthContext: Exception caught in fetchUserAttributes, returning defaults');
      // Return defaults on error
      return {
        idbu: '00000000-0000-0000-0000-000000000000',
        nombre: 'Usuario Temporal',
        userRole: 'Medico',
        estado: 'Activo',
        deleted_at: null
      };
    }
  };

  useEffect(() => {
    // Check active sessions and set the user with role
    const checkSessionAndSetUser = async () => {
      console.log('checkSessionAndSetUser called');
      console.log('AuthContext: === STARTING checkSessionAndSetUser ===');
      setLoading(true); // Ensure loading is true at the very start
      console.log('AuthContext: setLoading(true) called at start');

      // Introduce a small delay to allow localStorage to synchronize in new tabs
      await sleep(100); // Wait for 100ms
      console.log('AuthContext: After 100ms sleep delay');
      try {
        console.log('Calling supabase.auth.getSession()');
        console.log('AuthContext: About to call supabase.auth.getSession()');
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthContext: supabase.auth.getSession() completed. Error:', error, 'Data exists:', !!data);
        if (error) {
          console.error('Error getting session:', error);
          console.log('AuthContext: Session error detected, setting user to null');
          setUser(null);
          console.log('AuthContext: setUser(null) called due to session error');
          setLoading(false);
          console.log('AuthContext: setLoading(false) called due to session error');
          return;
        }
        
        const { session } = data;
        //console.log('Session data received:', session);
        console.log('AuthContext: Session extracted. Session exists:', !!session, 'User exists:', !!session?.user);
        
        if (session?.user) {
          console.log('Session user exists:', session.user.id);
          console.log('AuthContext: Session user found, about to fetch attributes');
          try {
            console.log('AuthContext: Calling fetchUserAttributes for user:', session.user.id);
            const userAttributes = await fetchUserAttributes(session.user.id);
            console.log('User attributes obtained from checkSessionAndSetUser:', userAttributes);
            console.log('AuthContext: fetchUserAttributes completed successfully');
            console.log('AuthContext: Setting user with attributes:', { userId: session.user.id, attributes: userAttributes });
            setUser({ ...session.user, ...userAttributes });
            console.log('AuthContext: setUser called with user and attributes');
          } catch (attrError) {
            console.error('Error fetching user attributes in checkSessionAndSetUser:', attrError);
            console.log('AuthContext: Error in fetchUserAttributes, setting user without attributes');
            setUser(session.user);
            console.log('AuthContext: setUser called with session.user only');
          }
        } else {
          console.log('No session user found in checkSessionAndSetUser.');
          console.log('AuthContext: No session user, setting user to null');
          setUser(null);
          console.log('AuthContext: setUser(null) called - no session user');
        }
      } catch (error) {
        console.error('Error during supabase.auth.getSession() in checkSessionAndSetUser:', error);
        console.log('AuthContext: Exception in checkSessionAndSetUser:', error);
        setUser(null);
        console.log('AuthContext: setUser(null) called due to exception');
      } finally {
        console.log('checkSessionAndSetUser finally block entered.');
        console.log('AuthContext: === FINALLY BLOCK checkSessionAndSetUser ===');
        console.log('setLoading(false) executed in checkSessionAndSetUser finally block.');
        console.log('AuthContext: About to call setLoading(false) in finally block');
        setLoading(false);
        console.log('AuthContext: setLoading(false) EXECUTED in finally block');
        console.log('AuthContext: === END checkSessionAndSetUser ===');
      }
    };
    
    console.log('AuthContext: About to call checkSessionAndSetUser');
    checkSessionAndSetUser();
    console.log('AuthContext: checkSessionAndSetUser call initiated');

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, 'Session:', session);
      console.log('AuthContext: === AUTH STATE CHANGE EVENT ===', _event);
      
      // Add timeout to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        console.log('AuthContext: Auth state change timeout reached, forcing loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        if (session?.user) {
          console.log('Auth state change: Session user exists:', session.user.id);
          console.log('AuthContext: Auth state change - user exists, fetching attributes');
          try {
            console.log('AuthContext: Auth state change - calling fetchUserAttributes');
            const userAttributes = await fetchUserAttributes(session.user.id);
            console.log('Auth state change: User attributes obtained:', userAttributes);
            console.log('AuthContext: Auth state change - attributes fetched successfully');
            setUser({ ...session.user, ...userAttributes });
            console.log('AuthContext: Auth state change - setUser called with attributes');
          } catch (attrError) {
            console.error('Auth state change: Error fetching user attributes:', attrError);
            console.log('AuthContext: Auth state change - error fetching attributes, using session user only');
            setUser({ 
              ...session.user, 
              userRole: 'Medico',
              idbu: '00000000-0000-0000-0000-000000000000',
              nombre: 'Usuario Temporal',
              estado: 'Activo'
            });
            console.log('AuthContext: Auth state change - setUser called with session user only');
          }
        } else {
          console.log('Auth state change: No session user found.');
          console.log('AuthContext: Auth state change - no session user, setting null');
          setUser(null);
          console.log('AuthContext: Auth state change - setUser(null) called');
        }
      } catch (error) {
        console.error('Auth state change: Error in auth state change handler:', error);
        console.log('AuthContext: Auth state change - exception caught:', error);
        setUser(null);
        console.log('AuthContext: Auth state change - setUser(null) called due to exception');
      } finally {
        clearTimeout(timeoutId); // Clear the timeout if we complete successfully
        console.log('onAuthStateChange finally block entered.');
        console.log('AuthContext: === AUTH STATE CHANGE FINALLY ===');
        console.log('Auth state change: setLoading(false) executed in finally block.');
        console.log('AuthContext: Auth state change - about to call setLoading(false)');
        setLoading(false);
        console.log('AuthContext: Auth state change - setLoading(false) EXECUTED');
        console.log('AuthContext: === END AUTH STATE CHANGE ===');
      }
    });

    console.log('AuthContext: Auth state change listener set up');
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

  console.log('AuthContext: Rendering provider with values - user exists:', !!user, 'loading:', loading);
  
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        (() => {
          console.log('AuthContext: Rendering loading screen because loading =', loading);
          return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando DoctorSoft...</p>
        </div>
          );
        })()
      ) : (
        (() => {
          console.log('AuthContext: Rendering children because loading =', loading);
          return children;
        })()
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