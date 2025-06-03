import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src/frontend",
  build: {
    outDir: "../../dist/frontend",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/frontend/src/index.ts"),
      },
      output: {
        entryFileNames: "bundle.js",
        assetFileNames: "bundle.[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
});
