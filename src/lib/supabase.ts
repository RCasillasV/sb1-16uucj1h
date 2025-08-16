import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

declare global {
  interface Window {
    _supabaseClient?: ReturnType<typeof createClient>;
  }
}

// Fetch con timeout personalizado (60s)
const fetchWithTimeout = (url: string, options: any = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

// Storage personalizado para manejar errores de localStorage
const customStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error('Error al acceder a localStorage:', err);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Error al eliminar de localStorage:', err);
    }
  }
};

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appVersion = import.meta.env.VITE_APP_VERSION || 'dev';

// Validación de entorno
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Revisa tu archivo .env.'
  );
}

// Logs solo en desarrollo
if (import.meta.env.DEV) {
  console.log('Supabase URL encontrada:', !!supabaseUrl);
  console.log('Supabase Key encontrada:', !!supabaseKey);
  console.log('Versión de la app:', appVersion);
}

// Factory / Singleton para cliente Supabase
function getSupabaseClient() {
  if (import.meta.env.DEV && window._supabaseClient) {
    return window._supabaseClient;
  }

  const client = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // solo activa con OAuth redirect
      storage: customStorage,
      storageKey: 'supabase.auth.session'
    },
    realtime: {
      params: { eventsPerSecond: 2 }
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        'x-application-name': `doctorsoft/${appVersion}`
      }
    }
  });

  if (import.meta.env.DEV) {
    window._supabaseClient = client;
  }

  return client;
}

export const supabase = getSupabaseClient();