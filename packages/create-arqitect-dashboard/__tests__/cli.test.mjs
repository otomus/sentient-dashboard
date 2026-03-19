import { describe, it, expect } from "vitest";
import { parseArgs } from "../bin/cli.mjs";

describe("parseArgs", () => {
  // Helper: simulates process.argv where first two entries are node + script
  const argv = (...userArgs) => ["node", "cli.mjs", ...userArgs];

  it("parses --server-address flag", () => {
    const result = parseArgs(argv("--server-address", "192.168.1.10:4000"));
    expect(result).toEqual({
      serverAddress: "192.168.1.10:4000",
      targetDir: null,
    });
  });

  it("parses --server-address with a target directory", () => {
    const result = parseArgs(
      argv("--server-address", "192.168.1.10:4000", "/tmp/my-dashboard"),
    );
    expect(result).toEqual({
      serverAddress: "192.168.1.10:4000",
      targetDir: "/tmp/my-dashboard",
    });
  });

  it("parses target directory before --server-address (order independent)", () => {
    const result = parseArgs(
      argv("/tmp/my-dashboard", "--server-address", "192.168.1.10:4000"),
    );
    expect(result).toEqual({
      serverAddress: "192.168.1.10:4000",
      targetDir: "/tmp/my-dashboard",
    });
  });

  it("returns null serverAddress when flag is omitted", () => {
    const result = parseArgs(argv("/tmp/my-dashboard"));
    expect(result).toEqual({
      serverAddress: null,
      targetDir: "/tmp/my-dashboard",
    });
  });

  it("returns undefined serverAddress when --server-address has no value", () => {
    const result = parseArgs(argv("--server-address"));
    expect(result).toEqual({
      serverAddress: undefined,
      targetDir: null,
    });
  });

  it("returns both null when no args are provided", () => {
    const result = parseArgs(argv());
    expect(result).toEqual({
      serverAddress: null,
      targetDir: null,
    });
  });

  it("ignores unknown flags", () => {
    const result = parseArgs(
      argv("--verbose", "--server-address", "host:1234"),
    );
    expect(result).toEqual({
      serverAddress: "host:1234",
      targetDir: null,
    });
  });

  it("uses the last positional arg as targetDir when multiple given", () => {
    const result = parseArgs(argv("first-dir", "second-dir"));
    expect(result).toEqual({
      serverAddress: null,
      targetDir: "second-dir",
    });
  });
});
