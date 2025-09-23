// @ts-ignore Mejorado en wsc

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

declare global {
  interface Window {
    _supabaseClient?: SupabaseClient<Database>;
  }
}

// SSR/embedded safe checks
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// Fetch con timeout personalizado (60s)
const fetchWithTimeout = (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  const withSignal: RequestInit = { ...options, signal: controller.signal };
  
  return fetch(url, withSignal)
    .catch((error) => {
      // Provide more detailed error information for debugging
      console.error('Supabase fetch error details:', {
        url,
        error: error.message,
        supabaseUrl: supabaseUrl,
        hasValidUrl: !!supabaseUrl && supabaseUrl.startsWith('https://'),
        hasValidKey: !!supabaseKey && supabaseKey.length > 50,
        userAgent: navigator.userAgent
      });
      
      if (error.name === 'AbortError') {
        throw new Error('Conexión a Supabase interrumpida por timeout (60s). Verifique su conexión a internet.');
      } else if (error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con Supabase. Verifique: 1) Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env, 2) Su conexión a internet, 3) Que el proyecto Supabase esté activo.');
      }
      throw error;
    })
    .finally(() => clearTimeout(timeoutId));
};

// Storage personalizado para manejar errores de localStorage (SSR-safe)
const customStorage = {
  getItem: (key: string) => {
    try {
      if (!isBrowser) return null;
      return localStorage.getItem(key);
    } catch (err) {
      console.error('Error al acceder a localStorage:', err);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (!isBrowser) return;
      localStorage.setItem(key, value);
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
    }
  },
  removeItem: (key: string) => {
    try {
      if (!isBrowser) return;
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
// Controla detectSessionInUrl por env: VITE_SUPABASE_DETECT_SESSION_IN_URL=true/false
const detectSessionInUrlFlag =
  String(import.meta.env.VITE_SUPABASE_DETECT_SESSION_IN_URL || '').toLowerCase() === 'true';

// Validación de entorno
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env.');
}

// Logs solo en desarrollo
if (import.meta.env.DEV) {
  console.log('Supabase URL encontrada:', !!supabaseUrl);
  console.log('Supabase Key encontrada:', !!supabaseKey);
  console.log('Versión de la app:', appVersion);
  console.log('detectSessionInUrl:', detectSessionInUrlFlag);
}

// Factory / Singleton para cliente Supabase
function getSupabaseClient(): SupabaseClient<Database> {
  if (import.meta.env.DEV && isBrowser && window._supabaseClient) {
    return window._supabaseClient;
  }

  const client = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      // Activa solo si usas OAuth redirect (regreso con fragment en URL)
      detectSessionInUrl: detectSessionInUrlFlag,
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

  if (import.meta.env.DEV && isBrowser) {
    window._supabaseClient = client;
  }

  return client;
}

export const supabase = getSupabaseClient();

// Útil en pruebas o cuando quieras pedirlo de forma perezosa
export function getSupabase() {
  return supabase;
}