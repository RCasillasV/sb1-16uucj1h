import { supabase } from './supabase';
import { AuthApiError } from '@supabase/supabase-js';

export async function requireSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new Error('Debe iniciar sesión');
  }
  return session.user;
}

export async function getIdbu(): Promise<string> {
  const user = await requireSession();
  try {
    const { data, error } = await supabase.rpc('get_idbu');
    if (error) {
      console.error('Error calling get_useridbu RPC:', error);
      // Fallback to default BU if RPC fails or returns null
      return '00000000-0000-0000-0000-000000000000'; 
    }
    return data || '00000000-0000-0000-0000-000000000000';
  } catch (error) {
    console.error('Exception in getIdbu:', error);
    return '00000000-0000-0000-0000-000000000000';
  }
}

export async function requireBusinessUnit(userId: string): Promise<string> {
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
