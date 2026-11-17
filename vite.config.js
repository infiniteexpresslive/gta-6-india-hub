import { defineConfig } from "vite";
import { resolve } from "path";

const pages = {
  main: resolve(__dirname, "index.html"),
  countdown: resolve(__dirname, "countdown.html"),
  download: resolve(__dirname, "download-calculator.html"),
  cost: resolve(__dirname, "cost-calculator.html"),
  planner: resolve(__dirname, "launch-planner.html"),
  quiz: resolve(__dirname, "edition-quiz.html"),
  support: resolve(__dirname, "support.html"),
  about: resolve(__dirname, "about.html"),
  privacy: resolve(__dirname, "privacy.html"),
  notFound: resolve(__dirname, "404.html")
};

export default defineConfig({
  appType: "mpa",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: pages
    }
  },
  server: {
    port: 8080,
    strictPort: true
  },
  preview: {
    port: 8080,
    strictPort: true
  }
});
