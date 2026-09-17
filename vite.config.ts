import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "client",
  plugins: [
    react(),
    {
      name: "sec-headers",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split("?")[0] ?? "";
          const book = path === "/b" || path.startsWith("/b/");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader("Content-Security-Policy", book ? "frame-ancestors *" : "frame-ancestors 'self'");
          next();
        });
      },
    },
  ],
  build: {
    outDir: resolve(here, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/health": "http://127.0.0.1:3000",
    },
  },
});
