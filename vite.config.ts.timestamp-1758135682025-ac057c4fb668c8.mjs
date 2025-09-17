// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
var requiredEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_MAX_FILE_SIZE_MB",
  "VITE_BUCKET_NAME"
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in environment variables`);
  }
}
var vite_config_default = defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react", "clsx"],
          "vendor-date": ["date-fns"],
          "vendor-editor": ["react-quill"],
          "vendor-calendar": [
            "@fullcalendar/core",
            "@fullcalendar/daygrid",
            "@fullcalendar/interaction",
            "@fullcalendar/react",
            "@fullcalendar/timegrid"
          ]
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    assetsInlineLimit: 4096,
    sourcemap: false,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "clsx",
      "date-fns",
      "@fullcalendar/core",
      "@fullcalendar/daygrid",
      "@fullcalendar/interaction",
      "@fullcalendar/react",
      "@fullcalendar/timegrid",
      "@supabase/supabase-js",
      "@tanstack/react-query"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIFZhbGlkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcyBhdCBidWlsZCB0aW1lXG5jb25zdCByZXF1aXJlZEVudlZhcnMgPSBbXG4gICdWSVRFX1NVUEFCQVNFX1VSTCcsIFxuICAnVklURV9TVVBBQkFTRV9BTk9OX0tFWScsXG4gICdWSVRFX01BWF9GSUxFX1NJWkVfTUInLFxuICAnVklURV9CVUNLRVRfTkFNRSdcbl07XG5mb3IgKGNvbnN0IGVudlZhciBvZiByZXF1aXJlZEVudlZhcnMpIHtcbiAgaWYgKCFwcm9jZXNzLmVudltlbnZWYXJdKSB7XG4gICAgY29uc29sZS53YXJuKGBXYXJuaW5nOiAke2VudlZhcn0gaXMgbm90IHNldCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXNgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICd2ZW5kb3ItY29yZSc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndmVuZG9yLXVpJzogWydsdWNpZGUtcmVhY3QnLCAnY2xzeCddLFxuICAgICAgICAgICd2ZW5kb3ItZGF0ZSc6IFsnZGF0ZS1mbnMnXSxcbiAgICAgICAgICAndmVuZG9yLWVkaXRvcic6IFsncmVhY3QtcXVpbGwnXSxcbiAgICAgICAgICAndmVuZG9yLWNhbGVuZGFyJzogW1xuICAgICAgICAgICAgJ0BmdWxsY2FsZW5kYXIvY29yZScsXG4gICAgICAgICAgICAnQGZ1bGxjYWxlbmRhci9kYXlncmlkJyxcbiAgICAgICAgICAgICdAZnVsbGNhbGVuZGFyL2ludGVyYWN0aW9uJyxcbiAgICAgICAgICAgICdAZnVsbGNhbGVuZGFyL3JlYWN0JyxcbiAgICAgICAgICAgICdAZnVsbGNhbGVuZGFyL3RpbWVncmlkJ1xuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XScsXG4gICAgICB9LFxuICAgIH0sXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsIFxuICAgICAgJ3JlYWN0LWRvbScsIFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLCBcbiAgICAgICdsdWNpZGUtcmVhY3QnLCBcbiAgICAgICdjbHN4JywgXG4gICAgICAnZGF0ZS1mbnMnLFxuICAgICAgJ0BmdWxsY2FsZW5kYXIvY29yZScsXG4gICAgICAnQGZ1bGxjYWxlbmRhci9kYXlncmlkJyxcbiAgICAgICdAZnVsbGNhbGVuZGFyL2ludGVyYWN0aW9uJyxcbiAgICAgICdAZnVsbGNhbGVuZGFyL3JlYWN0JyxcbiAgICAgICdAZnVsbGNhbGVuZGFyL3RpbWVncmlkJyxcbiAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSdcbiAgICBdXG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBR2xCLElBQU0sa0JBQWtCO0FBQUEsRUFDdEI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRjtBQUNBLFdBQVcsVUFBVSxpQkFBaUI7QUFDcEMsTUFBSSxDQUFDLFFBQVEsSUFBSSxNQUFNLEdBQUc7QUFDeEIsWUFBUSxLQUFLLFlBQVksTUFBTSxzQ0FBc0M7QUFBQSxFQUN2RTtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGVBQWUsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDeEQsYUFBYSxDQUFDLGdCQUFnQixNQUFNO0FBQUEsVUFDcEMsZUFBZSxDQUFDLFVBQVU7QUFBQSxVQUMxQixpQkFBaUIsQ0FBQyxhQUFhO0FBQUEsVUFDL0IsbUJBQW1CO0FBQUEsWUFDakI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLElBQ0EsbUJBQW1CO0FBQUEsSUFDbkIsV0FBVztBQUFBLElBQ1gsc0JBQXNCO0FBQUEsRUFDeEI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
