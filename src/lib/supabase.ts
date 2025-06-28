import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Use default values for development if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Log environment variables for debugging
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Show warning instead of throwing error to prevent app from crashing
if (supabaseUrl === 'https://your-project-id.supabase.co' || !supabaseKey || supabaseKey === 'your-supabase-anon-key') {
  console.warn('⚠️ Using placeholder Supabase credentials. Please update your .env file with actual values for production use.');
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
  console.log('Initializing Supabase connection...');
  console.log('Initializing Supabase connection...');
  for (let i = 0; i < retries; i++) {
    try {
      // Test database access using the correct table name 'tcPacientes'
      // Use a try/catch block to handle potential errors more gracefully
      try {
        const { error } = await supabase
          .from('tcPacientes')
          .select('id')
          .limit(1);

        if (!error) {
          console.log('✅ Supabase initialized successfully');
          return true;
        }
        
        console.warn(`⚠️ Initialization attempt ${i + 1} failed:`, error.message);
      } catch (innerError) {
        console.warn(`⚠️ Supabase query failed:`, innerError);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`❌ Initialization attempt ${i + 1} failed:`, error);
      if (i === retries - 1) return false;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.warn('⚠️ Supabase initialization failed after multiple attempts');
  return false;
}