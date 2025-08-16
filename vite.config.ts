import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Validate environment variables at build time
const requiredEnvVars = [
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY',
  'VITE_MAX_FILE_SIZE_MB',
  'VITE_BUCKET_NAME'
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in environment variables`);
  }
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
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'clsx'],
          'vendor-date': ['date-fns'],
          'vendor-editor': ['react-quill'],
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/react',
            '@fullcalendar/timegrid'
          ],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    assetsInlineLimit: 4096,
    sourcemap: false,
    reportCompressedSize: false,
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