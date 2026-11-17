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

/** Pretty paths for local Vite (matches Vercel cleanUrls). */
const CLEAN_ROUTES = {
  "/countdown": "/countdown.html",
  "/download-calculator": "/download-calculator.html",
  "/cost-calculator": "/cost-calculator.html",
  "/launch-planner": "/launch-planner.html",
  "/edition-quiz": "/edition-quiz.html",
  "/support": "/support.html",
  "/about": "/about.html",
  "/privacy": "/privacy.html",
  "/404": "/404.html"
};

function cleanUrlsDevPlugin() {
  function rewrite(req) {
    if (!req.url) return;
    const [pathname, search = ""] = req.url.split("?");
    const q = search ? `?${search}` : "";
    if (CLEAN_ROUTES[pathname]) {
      req.url = CLEAN_ROUTES[pathname] + q;
    }
  }
  return {
    name: "unlockist-clean-urls",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    }
  };
}

export default defineConfig({
  appType: "mpa",
  publicDir: "public",
  plugins: [cleanUrlsDevPlugin()],
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
