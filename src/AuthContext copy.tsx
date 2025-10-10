import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

// Types
interface SupabaseUser {
  rol: string;
  idbu: string;
  nombre: string;
  estado: string;
}

// We'll create a new type that combines User with our custom attributes
type UserWithAttributes = Omit<User, 'deleted_at'> & {
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
  error: AuthError | null;
  clearError: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export types
export type { AuthContextType, UserWithAttributes };

// Main AuthProvider component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Caché de información extendida por userId
  const extendedInfoCache = useRef<Map<string, Partial<UserWithAttributes>>>(new Map());
  // Referencia al usuario actual para usar en callbacks sin dependencias
  const userRef = useRef<UserWithAttributes | null>(null);
  
  // Mantener userRef sincronizado con user
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  const getExtendedUserInfo = useCallback(async (userId: string, useCache: boolean = true): Promise<Partial<UserWithAttributes>> => {
    // Verificar caché primero
    if (useCache && extendedInfoCache.current.has(userId)) {
      if (import.meta.env.DEV) {
        console.log('✨ getExtendedUserInfo: Usando caché para userId:', userId);
      }
      return extendedInfoCache.current.get(userId)!;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('getExtendedUserInfo timeout after 10 seconds')), 10000);
    });

    try {
      if (import.meta.env.DEV) {
        console.log('🔍 getExtendedUserInfo: Starting query for userId:', userId);
      }
      
      const queryPromise = supabase
        .from('tcUsuarios')
        .select('rol, idbu, nombre, estado')
        .eq('idusuario', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (import.meta.env.DEV) {
        console.log('📄 getExtendedUserInfo: Query result:', { data, error });
      }

      if (error) {
        console.error('❌ getExtendedUserInfo: Database error:', error);
        throw error;
      }

      const userData = data as SupabaseUser;
      
      // Use a simple default instead of calling getIdbu() which can cause issues
      const result = {
        userRole: userData.rol || 'Medico',
        idbu: userData.idbu || 'DEFAULT_BU',
        nombre: userData.nombre || 'Usuario',
        estado: userData.estado || 'Activo'
      };
      
      // Guardar en caché
      extendedInfoCache.current.set(userId, result);
      
      if (import.meta.env.DEV) {
        console.log('✅ getExtendedUserInfo: Returning result:', result);
      }
      return result;
    } catch (err) {
      console.error('❌ getExtendedUserInfo: Error occurred:', err);
      
      // Use static defaults
      const fallbackResult = {
        userRole: 'Medico' as const,
        idbu: 'DEFAULT_BU',
        nombre: 'Usuario' as const,
        estado: 'Activo' as const
      };
      
      if (import.meta.env.DEV) {
        console.log('🔄 getExtendedUserInfo: Returning fallback result:', fallbackResult);
      }
      return fallbackResult;
    }
  }, []); // Sin dependencias para evitar bucle infinito

  // Handle auth state changes
  useEffect(() => {
    let isMounted = true;
    
    console.log('🚀 AuthProvider: Setting up auth state change listener');
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthProvider: Auth state changed - ${event}`);
        
        if (!isMounted) return;
        
        try {
          // Solo bloquear UI en eventos de login/logout inicial, NO en refresh
          const shouldBlock = event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT';
          
          if (shouldBlock) {
            setLoading(true);
          }
          
          setError(null); // Clear any previous errors
          
          if (session?.user) {
            if (event === 'TOKEN_REFRESHED') {
              // En refresh de token, NO bloquear UI ni reconsultar BD
              // Solo actualizar el user object con la sesión nueva si ya existe
              if (isMounted && userRef.current) {
                console.log('AuthProvider: Token refreshed, updating session without blocking UI');
                const finalUser = { ...session.user, ...userRef.current };
                setUser(finalUser);
              }
            } else {
              // En login inicial o SIGNED_IN, sí consultar info extendida
              console.log('AuthProvider: User session found, fetching extended info');
              
              // Para INITIAL_SESSION, cargar usuario inmediatamente con defaults y luego actualizar
              if (event === 'INITIAL_SESSION') {
                // Cargar usuario con defaults inmediatamente para no bloquear UI
                const tempUser = { 
                  ...session.user, 
                  userRole: 'Medico',
                  idbu: 'DEFAULT_BU',
                  nombre: 'Usuario',
                  estado: 'Activo'
                };
                if (isMounted) {
                  setUser(tempUser);
                  setLoading(false); // Desbloquear UI inmediatamente
                }
                
                // Actualizar con datos reales en segundo plano
                getExtendedUserInfo(session.user.id, true).then(extendedInfo => {
                  if (isMounted) {
                    const finalUser = { ...session.user, ...extendedInfo };
                    console.log('AuthProvider: Updated user with real data:', finalUser);
                    setUser(finalUser);
                  }
                }).catch(err => {
                  console.error('Error fetching extended info in background:', err);
                });
              } else {
                // Para SIGNED_IN, esperar la info extendida
                const extendedInfo = await getExtendedUserInfo(session.user.id, true);
                console.log('AuthProvider: Extended info received:', extendedInfo);
                
                if (isMounted) {
                  const finalUser = { ...session.user, ...extendedInfo };
                  console.log('AuthProvider: Final user object:', finalUser);
                  setUser(finalUser);
                }
              }
            }
          } else {
            console.log('AuthProvider: No user session, clearing state');
            if (isMounted) {
              setUser(null);
              // Limpiar caché al cerrar sesión
              extendedInfoCache.current.clear();
            }
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
          if (isMounted) {
            setError(err as AuthError);
            setUser(null); // Clear user on error
          }
        } finally {
          if (isMounted && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
            console.log('AuthProvider: Setting loading to false');
            setLoading(false);
          }
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('AuthProvider: Cleaning up auth state listener');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias para evitar bucle infinito

  const signOut = useCallback(async () => {
    console.log('AuthProvider: Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      setError(error);
    }
    // User will be set to null by the auth state change listener
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signOut,
    error,
    clearError
  }), [user, loading, signOut, error, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Named exports for better Fast Refresh compatibility
export { AuthContext, AuthProvider };
