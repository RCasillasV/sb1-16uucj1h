import { supabase } from '../lib/supabase';

export async function requireSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new Error('Debe iniciar sesión');
  }
  return session.user;
}

export async function requireBusinessUnit(userId: string) {
  const attrs = await users.getCurrentUserAttributes(userId);
  if (!attrs?.idbu) {
    throw new Error('Usuario sin unidad de negocio (idbu)');
  }
  return attrs.idbu;
}

export async function handle<T>(
  promise: Promise<{ data: T; error: any }>,
  fallback: T
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    console.error('Supabase error:', error);
    return fallback;
  }
  return data;
}