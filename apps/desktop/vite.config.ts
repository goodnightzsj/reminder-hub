import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri dev server expects a fixed port; production build just outputs static files.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: ["chrome120", "safari16"],
    outDir: "dist",
    sourcemap: true,
  },
});
