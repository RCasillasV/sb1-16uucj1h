window._supabaseClient
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
declare global {
  interface Window {
    _supabaseClient?: ReturnType<typeof createClient>;
  }
}
// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variables for debugging
 console.log('Supabase URL exists:', !!supabaseUrl);
 console.log('Supabase Key exists:', !!supabaseKey);

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}
/*
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    },
    storageKey: 'supabase.auth.session',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    headers: { 'x-application-name': 'doctorsoft' },
  },
});

// Initialize the connection and verify access with retry mechanism
export async function initializeSupabase(retries = 3, delay = 1000) {
  console.log(`Initializing Supabase connection to ${supabaseUrl}...`);
  for (let i = 0; i < retries; i++) {
    try {
      //Simple health check to verify connection
      const { data, error } = await supabase.auth.getSession();
 
      if (!error) {
        console.log('✅ Supabase initialized successfully', data);
        return true;
      }

      console.warn(`⚠️ Initialization attempt ${i + 1}/${retries} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`❌ Initialization attempt ${i + 1}/${retries} failed:`, error);
      if (i === retries - 1) return false;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Throw an error after all retries fail to ensure proper error handling
  throw new Error(`Failed to initialize Supabase after ${retries} attempts. Please check your connection and credentials.`);
}
*/
// ... (después de las comprobaciones de variables de entorno: if (!supabaseUrl || !supabaseKey) { ... })

// Implementación del patrón Singleton para el cliente Supabase
let supabaseClient: ReturnType<typeof createClient>;

// Comprueba si estamos en modo de desarrollo (import.meta.env.DEV)
// Y si ya existe una instancia del cliente Supabase en el objeto 'window'
if (import.meta.env.DEV && window._supabaseClient) {
  // Si es así, reutiliza esa instancia existente
  supabaseClient = window._supabaseClient;
} else {
  // Si no estamos en desarrollo o no hay una instancia existente, crea un nuevo cliente
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('Error setting localStorage:', error);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        }
      },
      storageKey: 'supabase.auth.session',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    global: {
      headers: { 'x-application-name': 'doctorsoft' },
    },
  });

  // Si estamos en desarrollo, guarda la nueva instancia del cliente en el objeto 'window'
  if (import.meta.env.DEV) {
    window._supabaseClient = supabaseClient;
  }
}

// Exporta la instancia del cliente Supabase (ya sea la nueva o la reutilizada)
export const supabase = supabaseClient;
