#!/usr/bin/env node

import { scaffold } from "../lib/scaffold.mjs";

/**
 * Parses CLI arguments for the create-arqitect-dashboard command.
 * @param {string[]} argv - Raw process.argv array.
 * @returns {{ serverAddress: string | null, targetDir: string | null }}
 */
export function parseArgs(argv) {
  const args = argv.slice(2);
  let serverAddress = null;
  let targetDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--server-address") {
      serverAddress = args[++i];
    } else if (!args[i].startsWith("-")) {
      targetDir = args[i];
    }
  }

  return { serverAddress, targetDir };
}

// Only run when executed directly (not when imported for testing)
const isMain =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMain) {
  const { serverAddress, targetDir } = parseArgs(process.argv);

  if (!serverAddress) {
    console.error(
      `Error: --server-address is required

Usage: create-arqitect-dashboard --server-address <host:port> [target-dir]

Example:
  npx @otomus/create-arqitect-dashboard --server-address 192.168.1.10:4000`,
    );
    process.exit(1);
  }

  try {
    await scaffold({
      serverAddress,
      targetDir: targetDir || "./arqitect-dashboard",
    });
  } catch {
    process.exit(1);
  }
}
