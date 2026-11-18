import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Anything the browser asks for at /api/... is forwarded to Flask.
// Because the browser only talks to ONE address, the login cookie "just works"
// and we don't need CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:5555" },
  },
});
