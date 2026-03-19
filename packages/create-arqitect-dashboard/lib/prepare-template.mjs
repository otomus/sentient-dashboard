/**
 * prepack script: copies the dashboard source from the repo root into template/
 * so it gets published with the package.
 */
import { cp, rm, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const TEMPLATE_DIR = resolve(PKG_ROOT, "template");

/** Files and directories from the repo root to copy into the publishable template. */
const INCLUDE = [
  "src",
  "public",
  "index.html",
  "package.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "eslint.config.js",
  ".prettierrc",
];

/**
 * Cleans the template directory and copies all {@link INCLUDE} entries from the
 * repo root. Silently skips entries that do not exist (e.g. optional configs).
 */
export async function main() {
  // Clean previous template
  await rm(TEMPLATE_DIR, { recursive: true, force: true });
  await mkdir(TEMPLATE_DIR, { recursive: true });

  await Promise.all(
    INCLUDE.map(async (entry) => {
      const src = resolve(REPO_ROOT, entry);
      const dest = resolve(TEMPLATE_DIR, entry);
      try {
        await cp(src, dest, { recursive: true });
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
        // Skip files that don't exist (e.g. optional configs)
      }
    }),
  );

  console.log("Template prepared for packaging.");
}

// Only run when executed directly (not when imported for testing)
const isMain =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMain) {
  main();
}
