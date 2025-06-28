import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variables for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

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
  for (let i = 0; i < retries; i++) {
    try {
      // Test database access using the correct table name 'tcPacientes'
      const { error } = await supabase
        .from('tcPacientes')
        .select('id')
        .limit(1);

      if (!error) {
        console.log('Supabase initialized successfully');
        return true;
      }

      console.warn(`Initialization attempt ${i + 1} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Initialization attempt ${i + 1} failed:`, error);
      if (i === retries - 1) return false;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('Supabase initialization failed after all retries.'); // Añadir esta línea
  return false;
}