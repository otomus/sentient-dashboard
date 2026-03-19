import { cp, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "../template");

/**
 * Spawns a child process and returns a promise that resolves on exit code 0.
 * @param {string} cmd - Executable to run.
 * @param {string[]} args - Command-line arguments.
 * @param {string} cwd - Working directory for the child process.
 * @returns {Promise<void>}
 */
function run(cmd, args, cwd) {
  return new Promise((res, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
      else res();
    });
    child.on("error", reject);
  });
}

/**
 * Scaffolds a new arqitect-dashboard project by copying the template,
 * writing a `.env` file, and running `npm install` + `npm run build`.
 * Cleans up the target directory on failure.
 * @param {object} options
 * @param {string} options.serverAddress - Host:port of the arqitect-core server.
 * @param {string} options.targetDir - Relative or absolute path for the new project.
 */
export async function scaffold({ serverAddress, targetDir }) {
  const dest = resolve(process.cwd(), targetDir);

  try {
    await mkdir(dest, { recursive: false });
  } catch (err) {
    if (err.code === "EEXIST") {
      throw new Error(`Target directory already exists: ${dest}`);
    }
    throw err;
  }

  try {
    console.log(`Scaffolding arqitect-dashboard into ${dest}...`);

    await cp(TEMPLATE_DIR, dest, { recursive: true });
    console.log("Template copied.");

    await writeFile(resolve(dest, ".env"), `VITE_SERVER_ADDRESS=${serverAddress}\n`);
    console.log(`Configured VITE_SERVER_ADDRESS=${serverAddress}`);

    console.log("Installing dependencies...");
    await run("npm", ["install"], dest);

    console.log("Building...");
    await run("npm", ["run", "build"], dest);

    console.log(
      `\nDone! To start the dashboard:\n\n` +
        `  cd ${dest}\n` +
        `  npm run dev      # development server\n` +
        `  npm run preview  # preview production build\n`,
    );
  } catch (err) {
    console.error(`\nScaffolding failed: ${err.message}`);
    console.error(`Cleaning up ${dest}...`);
    await rm(dest, { recursive: true, force: true });
    throw err;
  }
}
