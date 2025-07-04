// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import vue from "file:///home/project/node_modules/@vitejs/plugin-vue/dist/index.mjs";
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
  plugins: [react(), vue()],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5cbi8vIFZhbGlkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcyBhdCBidWlsZCB0aW1lXG5jb25zdCByZXF1aXJlZEVudlZhcnMgPSBbXG4gICdWSVRFX1NVUEFCQVNFX1VSTCcsIFxuICAnVklURV9TVVBBQkFTRV9BTk9OX0tFWScsXG4gICdWSVRFX01BWF9GSUxFX1NJWkVfTUInLFxuICAnVklURV9CVUNLRVRfTkFNRSdcbl07XG5mb3IgKGNvbnN0IGVudlZhciBvZiByZXF1aXJlZEVudlZhcnMpIHtcbiAgaWYgKCFwcm9jZXNzLmVudltlbnZWYXJdKSB7XG4gICAgY29uc29sZS53YXJuKGBXYXJuaW5nOiAke2VudlZhcn0gaXMgbm90IHNldCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXNgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdnVlKCldLFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAndmVuZG9yLWNvcmUnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ3ZlbmRvci11aSc6IFsnbHVjaWRlLXJlYWN0JywgJ2Nsc3gnLCAndnVlJ10sXG4gICAgICAgICAgJ3ZlbmRvci1kYXRlJzogWydkYXRlLWZucyddLFxuICAgICAgICAgICd2ZW5kb3ItZWRpdG9yJzogWydyZWFjdC1xdWlsbCddLFxuICAgICAgICAgICd2ZW5kb3ItY2FsZW5kYXInOiBbXG4gICAgICAgICAgICAnQGZ1bGxjYWxlbmRhci9jb3JlJyxcbiAgICAgICAgICAgICdAZnVsbGNhbGVuZGFyL2RheWdyaWQnLFxuICAgICAgICAgICAgJ0BmdWxsY2FsZW5kYXIvaW50ZXJhY3Rpb24nLFxuICAgICAgICAgICAgJ0BmdWxsY2FsZW5kYXIvcmVhY3QnLFxuICAgICAgICAgICAgJ0BmdWxsY2FsZW5kYXIvdGltZWdyaWQnXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NixcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JywgXG4gICAgICAncmVhY3QtZG9tJywgXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsIFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsIFxuICAgICAgJ2Nsc3gnLCBcbiAgICAgICdkYXRlLWZucycsXG4gICAgICAnQGZ1bGxjYWxlbmRhci9jb3JlJyxcbiAgICAgICdAZnVsbGNhbGVuZGFyL2RheWdyaWQnLFxuICAgICAgJ0BmdWxsY2FsZW5kYXIvaW50ZXJhY3Rpb24nLFxuICAgICAgJ0BmdWxsY2FsZW5kYXIvcmVhY3QnLFxuICAgICAgJ0BmdWxsY2FsZW5kYXIvdGltZWdyaWQnLFxuICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcbiAgICBdXG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sU0FBUztBQUdoQixJQUFNLGtCQUFrQjtBQUFBLEVBQ3RCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0Y7QUFDQSxXQUFXLFVBQVUsaUJBQWlCO0FBQ3BDLE1BQUksQ0FBQyxRQUFRLElBQUksTUFBTSxHQUFHO0FBQ3hCLFlBQVEsS0FBSyxZQUFZLE1BQU0sc0NBQXNDO0FBQUEsRUFDdkU7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQUEsRUFDeEIsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osZUFBZSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN4RCxhQUFhLENBQUMsZ0JBQWdCLFFBQVEsS0FBSztBQUFBLFVBQzNDLGVBQWUsQ0FBQyxVQUFVO0FBQUEsVUFDMUIsaUJBQWlCLENBQUMsYUFBYTtBQUFBLFVBQy9CLG1CQUFtQjtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLG1CQUFtQjtBQUFBLElBQ25CLFdBQVc7QUFBQSxJQUNYLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
