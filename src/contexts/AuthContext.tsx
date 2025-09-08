import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DEFAULT_BU } from '../utils/constants';
import type { User, AuthError, AuthApiError } from '@supabase/supabase-js';

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
      // Simple query with timeout
      const { data, error } = await Promise.race([
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
        console.log('AuthProvider: Database query error, using defaults:', error.message);
        return {
          userRole: 'Medico',
          idbu: '00000000-0000-0000-0000-000000000000',
          nombre: 'Usuario',
          estado: 'Activo'
        };
      }

      console.log('AuthProvider: User info retrieved successfully:', data);
      return {
        userRole: data.rol,
        idbu: data.idbu || DEFAULT_BU,
        nombre: data.nombre,
        estado: data.estado
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
        
        // Get session with timeout
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
          const userInfo = await getBasicUserInfo(data.session.user.id);
          
          if (isMounted) {
            setUser({ ...data.session.user, ...userInfo });
            console.log('AuthProvider: User set successfully');
          }
        } else {
          console.log('AuthProvider: No session found');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.log('AuthProvider: Init error:', error);
        
        // Check for the specific refresh token error
        if (error instanceof AuthApiError && error.message.includes('Invalid Refresh Token')) {
          console.error('AuthProvider: Invalid Refresh Token detected during init. Forcing logout.');
          await signOut();
          return;
        }
        
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          console.log('AuthProvider: Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event);
      
      if (!isMounted) return;

      // Handle specific auth errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.error('AuthProvider: Token refresh failed, likely invalid refresh token.');
        await signOut();
        return;
      }

      if (session?.user) {
        console.log('AuthProvider: Auth change - user exists, getting info');
        try {
          const userInfo = await getBasicUserInfo(session.user.id);
          if (isMounted) {
            setUser({ ...session.user, ...userInfo });
          }
        } catch (error) {
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
        }
      } else {
        console.log('AuthProvider: Auth change - no user');
        if (isMounted) {
          setUser(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    // Initialize
    initAuth();

    // Cleanup
    return () => {
      console.log('AuthProvider: Cleanup - unmounting');
      isMounted = false;
      subscription.unsubscribe();
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