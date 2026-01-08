import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle size for better ASO metrics
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Optimize code splitting for faster load times (ASO factor)
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["react-icons", "@mui/material"],
          "dnd-vendor": ["@hello-pangea/dnd"],
        },
      },
    },
    // Preload critical assets
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
  },
  server: {
    // Better development experience
    open: "/",
    strictPort: false,
  },
  // Optimize performance metrics
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
