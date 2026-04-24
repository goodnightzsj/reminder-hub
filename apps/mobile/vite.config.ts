import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    target: ["chrome120", "safari16"],
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
});
