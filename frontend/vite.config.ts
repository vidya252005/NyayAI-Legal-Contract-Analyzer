import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Sensible standalone defaults instead of required env vars — this runs
// fine with a plain `npm run dev`, no .env needed just to boot the UI.
const port = Number(process.env.PORT) || 5173;
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: true,
    proxy: {
      // Lets the frontend call relative `/api/...` paths in both dev and
      // production (the production build is served behind the same reverse
      // proxy / static host in front of the API — see README).
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: true,
  },
});
