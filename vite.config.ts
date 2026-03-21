import { defineConfig } from "vite"; // Custom fix: use "vite" (not "vitest/config") to avoid Node v24 transformation errors
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    // VitePWA({}) // Custom fix: disabled to resolve core build issue; re-enable when PWA support is needed
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production improvements: minify bundles and only emit sourcemaps outside production
    minify: true,
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
