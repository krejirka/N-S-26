import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const MET_USER_AGENT = "n-s-26.ironknot.cz/1.0 github.com/krejirka/N-S-26";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/forecast": {
        target: "https://api.met.no",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/forecast/, "/weatherapi/locationforecast/2.0/compact"),
        headers: { "User-Agent": MET_USER_AGENT },
      },
    },
  },
});
