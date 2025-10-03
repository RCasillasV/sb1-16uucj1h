import { supabase } from './supabase';
import { AuthApiError } from '@supabase/supabase-js';

export async function requireSession() {
  console.log('requireSession: Validando sesión...');

  // Primero intentamos obtener la sesión actual
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('requireSession: Error obteniendo sesión:', error);
    throw new Error('Error al validar sesión: ' + error.message);
  }

  if (!session?.user) {
    console.error('requireSession: No hay sesión activa');
    throw new Error('Debe iniciar sesión');
  }

  // Verificar si el token está expirado o próximo a expirar (menos de 60 segundos)
  const expiresAt = session.expires_at;
  if (expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    console.log(`requireSession: Token expira en ${timeUntilExpiry} segundos`);

    // Si el token ya expiró o expirará en menos de 60 segundos, intentar renovarlo
    if (timeUntilExpiry < 60) {
      console.log('requireSession: Token expirado o próximo a expirar, renovando...');

      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('requireSession: Error al renovar sesión:', refreshError);
          throw new Error('Tu sesión ha expirado. Por favor, recarga la página para continuar.');
        }

        if (!refreshData?.session?.user) {
          console.error('requireSession: No se obtuvo sesión después de renovar');
          throw new Error('No se pudo renovar la sesión. Por favor, recarga la página.');
        }

        console.log('requireSession: Sesión renovada exitosamente');
        return refreshData.session.user;
      } catch (refreshError) {
        console.error('requireSession: Excepción al renovar sesión:', refreshError);

        // Si el error es por token inválido, dar mensaje específico
        if (refreshError instanceof AuthApiError && refreshError.message.includes('refresh_token')) {
          throw new Error('Tu sesión ha expirado completamente. Por favor, recarga la página e inicia sesión nuevamente.');
        }

        throw new Error('Error al renovar sesión. Por favor, recarga la página.');
      }
    }
  }

  console.log('requireSession: Sesión válida');
  return session.user;
}

export async function getIdbu(): Promise<string> {
  const user = await requireSession();
  try {
    const { data, error } = await supabase.rpc('get_idbu');
    if (error) {
      console.error('Error calling get_idbu RPC:', error);
      // Fallback to default BU if RPC fails or returns null
      return '00000000-0000-0000-0000-000000000000'; 
    }
    return data || '00000000-0000-0000-0000-000000000000';
  } catch (error) {
    console.error('Exception in getIdbu:', error);
    return '00000000-0000-0000-0000-000000000000';
  }
}

export async function requireBusinessUnit(): Promise<string> {
  return await getIdbu();
}
export async function handle<T>(
  promise: Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    console.error('Supabase error:', error);
    // Check for specific error codes like 'PGRST116' (no rows found)
    if (error.code === 'PGRST116') {
      return fallback;
    }
    throw new Error(error.message || 'Error desconocido de Supabase');
  }
  return data !== null ? data : fallback;
}
