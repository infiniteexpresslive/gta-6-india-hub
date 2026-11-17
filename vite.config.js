import { defineConfig, loadEnv } from "vite";
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

function readJsonBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolveBody({});
      try {
        resolveBody(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

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

/** Local /api/signup using the same Web3Forms env vars as Vercel. */
function signupApiDevPlugin() {
  return {
    name: "unlockist-signup-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || "").split("?")[0];
        if (path !== "/api/signup") return next();

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
          return;
        }

        const key = String(env.WEB3FORMS_ACCESS_KEY || process.env.WEB3FORMS_ACCESS_KEY || "").trim();
        const toEmail = String(
          env.SIGNUP_TO_EMAIL || process.env.SIGNUP_TO_EMAIL || "gamedaytools@gmail.com"
        ).trim();

        if (!key) {
          res.statusCode = 503;
          res.end(
            JSON.stringify({
              ok: false,
              error: "Signup not configured (missing WEB3FORMS_ACCESS_KEY)"
            })
          );
          return;
        }

        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON body" }));
          return;
        }

        const email = String(body.email || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: "Enter a valid email address." }));
          return;
        }
        if (String(body.company || body.website || "").trim()) {
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        try {
          const upstream = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              access_key: key,
              subject: "UnlockIST — launch reminder signup",
              name: "UnlockIST signup",
              email,
              replyto: email,
              to: toEmail,
              message: [
                "New UnlockIST launch reminder request.",
                `Email: ${email}`,
                `Inbox: ${toEmail}`,
                `Source: ${String(body.source || "unlockist-home")}`,
                `When: ${new Date().toISOString()}`
              ].join("\n")
            })
          });
          const data = await upstream.json().catch(() => ({}));
          if (!upstream.ok || data.success === false) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                ok: false,
                error: "Could not send signup. Try again later."
              })
            );
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              ok: false,
              error: "Could not reach mail provider. Try again later."
            })
          );
        }
      });
    }
  };
}

export default defineConfig({
  appType: "mpa",
  publicDir: "public",
  plugins: [cleanUrlsDevPlugin(), signupApiDevPlugin()],
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
