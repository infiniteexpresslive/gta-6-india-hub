/**
 * Production minify from src/ → site root.
 * Leaves config.js, data/*.json, i18n, assets readable at root.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { minify as minifyHtml } from "html-minifier-terser";
import CleanCSS from "clean-css";
import { minify as minifyJs } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

async function minifyJsFile(code, filename) {
  const result = await minifyJs(code, {
    compress: {
      dead_code: true,
      drop_console: false,
      passes: 2
    },
    mangle: {
      toplevel: false,
      properties: false
    },
    format: {
      comments: false,
      beautify: false
    },
    sourceMap: false
  });
  if (result.error) throw result.error;
  return result.code;
}

async function main() {
  if (!existsSync(src)) {
    console.error("Missing src/ — abort");
    process.exit(1);
  }

  mkdirSync(join(root, "css"), { recursive: true });
  mkdirSync(join(root, "js"), { recursive: true });

  // CSS
  for (const name of readdirSync(join(src, "css"))) {
    if (!name.endsWith(".css")) continue;
    const input = readFileSync(join(src, "css", name), "utf8");
    const out = new CleanCSS({ level: 2 }).minify(input);
    if (out.errors && out.errors.length) {
      console.error(out.errors);
      process.exit(1);
    }
    writeFileSync(join(root, "css", name), out.styles);
    console.log("css", name, input.length, "→", out.styles.length);
  }

  // JS (page scripts only — not config.js)
  for (const name of readdirSync(join(src, "js"))) {
    if (!name.endsWith(".js")) continue;
    const input = readFileSync(join(src, "js", name), "utf8");
    const out = await minifyJsFile(input, name);
    writeFileSync(join(root, "js", name), out);
    console.log("js", name, input.length, "→", out.length);
  }

  // HTML
  for (const name of readdirSync(src)) {
    if (!name.endsWith(".html")) continue;
    const input = readFileSync(join(src, name), "utf8");
    const out = await minifyHtml(input, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: false,
      keepClosingSlash: true,
      caseSensitive: false
    });
    writeFileSync(join(root, name), out);
    console.log("html", name, input.length, "→", out.length);
  }

  console.log("Done. config.js / data / i18n / assets left readable at root.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
