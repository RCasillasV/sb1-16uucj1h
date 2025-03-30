import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure Supabase client with performance optimizations
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
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
      // Test database access
      const { data, error } = await supabase
        .from('patients')
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

  return false;
}