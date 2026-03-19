import { describe, it, expect, beforeEach, vi } from "vitest";

const mockCp = vi.fn().mockResolvedValue(undefined);
const mockRm = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);

vi.mock(import("node:fs/promises"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      cp: mockCp,
      rm: mockRm,
      mkdir: mockMkdir,
    },
    cp: mockCp,
    rm: mockRm,
    mkdir: mockMkdir,
  };
});

const { main } = await import("../lib/prepare-template.mjs");

// Expected include list from prepare-template.mjs
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

describe("prepare-template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCp.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
  });

  it("removes existing template dir then creates it", async () => {
    await main();

    expect(mockRm).toHaveBeenCalledWith(
      expect.stringContaining("template"),
      { recursive: true, force: true },
    );

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining("template"),
      { recursive: true },
    );

    // rm should be called before mkdir
    const rmOrder = mockRm.mock.invocationCallOrder[0];
    const mkdirOrder = mockMkdir.mock.invocationCallOrder[0];
    expect(rmOrder).toBeLessThan(mkdirOrder);
  });

  it("copies each INCLUDE entry from repo root to template dir", async () => {
    await main();

    expect(mockCp).toHaveBeenCalledTimes(INCLUDE.length);

    for (const entry of INCLUDE) {
      expect(mockCp).toHaveBeenCalledWith(
        expect.stringContaining(entry),
        expect.stringContaining(`template/${entry}`),
        { recursive: true },
      );
    }
  });

  it("skips ENOENT errors (missing optional files)", async () => {
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    mockCp.mockRejectedValue(enoent);

    // Should not throw even though all cp calls fail with ENOENT
    await expect(main()).resolves.toBeUndefined();

    expect(mockCp).toHaveBeenCalledTimes(INCLUDE.length);
  });

  it("re-throws non-ENOENT errors", async () => {
    const eperm = Object.assign(new Error("EPERM"), { code: "EPERM" });
    mockCp.mockRejectedValue(eperm);

    await expect(main()).rejects.toThrow("EPERM");
  });
});
