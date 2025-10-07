// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DEFAULT_BU } from '../utils/constants';
import { getIdbu } from '../lib/supabaseUtils';
import { AuthApiError } from '@supabase/supabase-js';
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
  console.log('AuthProvider: Component rendering');
  const [user, setUser] = useState<UserWithAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear local storage
      localStorage.removeItem('rememberMe');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      setUser(null);
      navigate('/login', { 
        state: { message: 'Sesión cerrada exitosamente' }
      });
      
      return { error: error as AuthError | null };
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      setUser(null);
      navigate('/login');
      return { error: error as AuthError };
    }
  };

  // Simplified function to get basic user info
  const getBasicUserInfo = async (userId: string): Promise<Partial<UserWithAttributes>> => {
    console.log('AuthProvider: Getting basic user info for:', userId);
    
    try {
      // Simple query with reduced timeout
      const { data: tcUserData, error } = await Promise.race([
        supabase
          .from('tcUsuarios')
          .select('nombre, rol, idbu, estado')
          .eq('idusuario', userId)
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        )
      ]) as any;

      if (error) {
        console.log('AuthProvider: Database query error for tcUsuarios, using defaults:', error.message);
        const idbu = await getIdbu(); // Try to get idbu via RPC as fallback
        return {
          userRole: 'Medico',
          idbu: idbu,
          nombre: 'Usuario',
          estado: 'Activo'
        };
      }

      console.log('AuthProvider: User info retrieved successfully:', data);
      return {
        userRole: tcUserData.rol,
        idbu: tcUserData.idbu || DEFAULT_BU,
        nombre: tcUserData.nombre,
        estado: tcUserData.estado
      };
    } catch (error) {
      console.log('AuthProvider: Error getting user info, using defaults:', error);
      return {
        userRole: 'Medico',
        idbu: DEFAULT_BU,
        nombre: 'Usuario',
        estado: 'Activo'
      };
    }
  };

  useEffect(() => {
    console.log('AuthProvider: useEffect started');
    
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        console.log('AuthProvider: Getting initial session');

        // Get session with reduced timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (!isMounted) return;

        if (error) {
          console.log('AuthProvider: Session error:', error.message);
          setUser(null);
          setLoading(false);
          return;
        }

        if (data.session?.user) {
          console.log('AuthProvider: Session found, getting user info');

          // Set user immediately with basic data for faster UI
          if (isMounted) {
            setUser({
              ...data.session.user,
              userRole: 'Medico',
              idbu: DEFAULT_BU,
              nombre: 'Usuario',
              estado: 'Activo'
            });
            setLoading(false);
          }

          // Then fetch complete user info in background
          getBasicUserInfo(data.session.user.id).then(userInfo => {
            if (isMounted) {
              setUser({ ...data.session.user, ...userInfo });
              console.log('AuthProvider: User info updated');
            }
          }).catch(err => {
            console.log('AuthProvider: Error updating user info:', err);
          });
        } else {
          console.log('AuthProvider: No session found');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.log('AuthProvider: Init error:', error);
        // Si ya hay user previo, no lo borres por un timeout transitorio
        if (!(error instanceof AuthApiError)) {
          // Mantener user existente y quizás programar reintento
          return;
        }
        if (error.message.includes('Invalid Refresh Token')) {
          await signOut();
          return;
        }
        // En errores reales, limpia:
        setUser(null);
      } finally {
        if (isMounted) {
          console.log('AuthProvider: Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Auth state change listener - only handle significant events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event);

      if (!isMounted) return;

      // Handle token refresh - update user with refreshed session
      if (event === 'TOKEN_REFRESHED') {
        console.log('AuthProvider: Token renovado automáticamente');
        if (session?.user && isMounted) {
          // Actualizar usuario manteniendo datos previos pero con nueva sesión
          setUser(prev => prev ? { ...prev, ...session.user } : {
            ...session.user,
            userRole: 'Medico',
            idbu: DEFAULT_BU,
            nombre: 'Usuario',
            estado: 'Activo'
          });
        }
        return;
      }

      if (event === 'INITIAL_SESSION') {
        return; // Already handled by initAuth
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          console.log('AuthProvider: Auth change - user exists, getting info');
          getBasicUserInfo(session.user.id).then(userInfo => {
            if (isMounted) {
              setUser({ ...session.user, ...userInfo });
            }
          }).catch(error => {
            console.log('AuthProvider: Auth change error:', error);
            if (isMounted) {
              setUser({
                ...session.user,
                userRole: 'Medico',
                idbu: DEFAULT_BU,
                nombre: 'Usuario',
                estado: 'Activo'
              });
            }
          });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider: Auth change - signed out');
        if (isMounted) {
          setUser(null);
        }
      }
    });

    // Initialize
    initAuth();

    // Verificación periódica de sesión (cada 5 minutos)
    // Renovar preventivamente si el token expirará en menos de 10 minutos
    const sessionCheckInterval = setInterval(async () => {
      if (!isMounted) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = session.expires_at - now;

          // Si el token expirará en menos de 10 minutos (600 segundos), renovarlo preventivamente
          if (timeUntilExpiry < 600 && timeUntilExpiry > 0) {
            console.log(`AuthProvider: Token expirará en ${Math.floor(timeUntilExpiry / 60)} minutos, renovando preventivamente...`);

            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error('AuthProvider: Error en renovación preventiva:', refreshError);
            } else if (refreshData?.session?.user && isMounted) {
              console.log('AuthProvider: Sesión renovada preventivamente');
              setUser(prev => prev ? { ...prev, ...refreshData.session.user } : {
                ...refreshData.session.user,
                userRole: 'Medico',
                idbu: DEFAULT_BU,
                nombre: 'Usuario',
                estado: 'Activo'
              });
            }
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error en verificación periódica de sesión:', error);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    // Cleanup
    return () => {
      console.log('AuthProvider: Cleanup - unmounting');
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const value = {
    user,
    loading,
    signOut,
  };

  console.log('AuthProvider: Rendering with loading:', loading, 'user exists:', !!user);

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};