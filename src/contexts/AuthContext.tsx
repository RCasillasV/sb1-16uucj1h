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
  console.log('AuthProvider component rendering'); // Añadir esta línea
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
        console.log('Rol del usuario:', data.rol); // Añadir esta línea
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
      console.log('checkSessionAndSetUser called'); // Añadir esta línea
      try {
        console.log('Calling supabase.auth.getSession()'); // Añadir esta línea
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session data received:', session); // Añadir esta línea
        
        if (session?.user) {
          console.log('Session user exists:', session.user); // Añadir esta línea
          try {
            const userRole = await fetchUserRole(session.user.id);
            console.log('User role fetched:', userRole); // Añadir esta línea
            setUser({ ...session.user, userRole });
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
            setUser(session.user);
          }
        } else {
          console.log('No session user found.'); // Añadir esta línea
          setUser(null);
        }
      } catch (error) {
        console.error('Error during supabase.auth.getSession():', error); 
        setUser(null);
      } finally {
        setLoading(false);
        console.log('setLoading(false) executed in checkSessionAndSetUser finally block.'); // Añadir esta línea
      }
    };
    checkSessionAndSetUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, 'Session:', session); // Añadir esta línea
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
