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
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react", "clsx", "vue"],
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
      "@supabase/supabase-js"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIFZhbGlkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcyBhdCBidWlsZCB0aW1lXG5jb25zdCByZXF1aXJlZEVudlZhcnMgPSBbXG4gICdWSVRFX1NVUEFCQVNFX1VSTCcsIFxuICAnVklURV9TVVBBQkFTRV9BTk9OX0tFWScsXG4gICdWSVRFX01BWF9GSUxFX1NJWkVfTUInLFxuICAnVklURV9CVUNLRVRfTkFNRSdcbl07XG5mb3IgKGNvbnN0IGVudlZhciBvZiByZXF1aXJlZEVudlZhcnMpIHtcbiAgaWYgKCFwcm9jZXNzLmVudltlbnZWYXJdKSB7XG4gICAgY29uc29sZS53YXJuKGBXYXJuaW5nOiAke2VudlZhcn0gaXMgbm90IHNldCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXNgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICd2ZW5kb3ItY29yZSc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndmVuZG9yLXVpJzogWydsdWNpZGUtcmVhY3QnLCAnY2xzeCcsICd2dWUnXSxcbiAgICAgICAgICAndmVuZG9yLWRhdGUnOiBbJ2RhdGUtZm5zJ10sXG4gICAgICAgICAgJ3ZlbmRvci1lZGl0b3InOiBbJ3JlYWN0LXF1aWxsJ10sXG4gICAgICAgICAgJ3ZlbmRvci1jYWxlbmRhcic6IFtcbiAgICAgICAgICAgICdAZnVsbGNhbGVuZGFyL2NvcmUnLFxuICAgICAgICAgICAgJ0BmdWxsY2FsZW5kYXIvZGF5Z3JpZCcsXG4gICAgICAgICAgICAnQGZ1bGxjYWxlbmRhci9pbnRlcmFjdGlvbicsXG4gICAgICAgICAgICAnQGZ1bGxjYWxlbmRhci9yZWFjdCcsXG4gICAgICAgICAgICAnQGZ1bGxjYWxlbmRhci90aW1lZ3JpZCdcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLCBcbiAgICAgICdyZWFjdC1kb20nLCBcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJywgXG4gICAgICAnbHVjaWRlLXJlYWN0JywgXG4gICAgICAnY2xzeCcsIFxuICAgICAgJ2RhdGUtZm5zJyxcbiAgICAgICdAZnVsbGNhbGVuZGFyL2NvcmUnLFxuICAgICAgJ0BmdWxsY2FsZW5kYXIvZGF5Z3JpZCcsXG4gICAgICAnQGZ1bGxjYWxlbmRhci9pbnRlcmFjdGlvbicsXG4gICAgICAnQGZ1bGxjYWxlbmRhci9yZWFjdCcsXG4gICAgICAnQGZ1bGxjYWxlbmRhci90aW1lZ3JpZCcsXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xuICAgIF1cbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTSxrQkFBa0I7QUFBQSxFQUN0QjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBQ0EsV0FBVyxVQUFVLGlCQUFpQjtBQUNwQyxNQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sR0FBRztBQUN4QixZQUFRLEtBQUssWUFBWSxNQUFNLHNDQUFzQztBQUFBLEVBQ3ZFO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osZUFBZSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN4RCxhQUFhLENBQUMsZ0JBQWdCLFFBQVEsS0FBSztBQUFBLFVBQzNDLGVBQWUsQ0FBQyxVQUFVO0FBQUEsVUFDMUIsaUJBQWlCLENBQUMsYUFBYTtBQUFBLFVBQy9CLG1CQUFtQjtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLG1CQUFtQjtBQUFBLElBQ25CLFdBQVc7QUFBQSxJQUNYLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
