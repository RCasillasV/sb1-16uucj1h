import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Validate environment variables at build time
const requiredEnvVars = [
  { name: 'VITE_SUPABASE_URL', required: true },
  { name: 'VITE_SUPABASE_ANON_KEY', required: true },
  { name: 'VITE_MAX_FILE_SIZE_MB', required: false, default: '10' },
  { name: 'VITE_BUCKET_NAME', required: false, default: '00000000-default-bucket' }
];

let hasErrors = false;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar.name]) {
    if (envVar.required) {
      console.error(`ERROR: ${envVar.name} is required but not set in environment variables`);
      hasErrors = true;
    } else {
      console.log(`Info: ${envVar.name} not set, will use default: ${envVar.default}`);
    }
  }
}

if (hasErrors) {
  console.error('\nBuild cannot continue without required environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.\n');
}

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          // UI utilities
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx')) {
            return 'vendor-ui';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Forms
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
          // Rich text editor (lazy loaded)
          if (id.includes('node_modules/react-quill') || id.includes('node_modules/quill')) {
            return 'vendor-editor';
          }
          // Charts (lazy loaded)
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs')) {
            return 'vendor-charts';
          }
          // Calendar (lazy loaded)
          if (id.includes('node_modules/@fullcalendar')) {
            return 'vendor-calendar';
          }
          // DnD Kit
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    assetsInlineLimit: 4096,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react', 
      'clsx', 
      'date-fns',
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/interaction',
      '@fullcalendar/react',
      '@fullcalendar/timegrid',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  }
});