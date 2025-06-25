import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
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