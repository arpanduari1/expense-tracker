import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://expense-tracker-1p6d.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'https://expense-tracker-1p6d.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));