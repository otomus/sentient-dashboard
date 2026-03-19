import { describe, it, expect, beforeEach, vi } from "vitest";

const mockCp = vi.fn().mockResolvedValue(undefined);
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockRm = vi.fn().mockResolvedValue(undefined);
const mockSpawn = vi.fn();

vi.mock(import("node:fs/promises"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      cp: mockCp,
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
      rm: mockRm,
    },
    cp: mockCp,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    rm: mockRm,
  };
});

vi.mock(import("node:child_process"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      spawn: mockSpawn,
    },
    spawn: mockSpawn,
  };
});

const { scaffold } = await import("../lib/scaffold.mjs");

function makeSuccessSpawn() {
  return () => {
    const listeners = {};
    const child = {
      on: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
    };
    setTimeout(() => listeners.close?.(0), 0);
    return child;
  };
}

describe("scaffold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCp.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
    mockSpawn.mockImplementation(makeSuccessSpawn());
  });

  it("creates the target directory with recursive: false", async () => {
    await scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" });
    expect(mockMkdir).toHaveBeenCalledWith("/tmp/test-dir", {
      recursive: false,
    });
  });

  it("copies the template into the target directory", async () => {
    await scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" });
    expect(mockCp).toHaveBeenCalledWith(
      expect.stringContaining("template"),
      "/tmp/test-dir",
      { recursive: true },
    );
  });

  it("writes .env with correct VITE_SERVER_ADDRESS", async () => {
    await scaffold({
      serverAddress: "192.168.1.10:4000",
      targetDir: "/tmp/test-dir",
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\/tmp\/test-dir\/\.env$/),
      "VITE_SERVER_ADDRESS=192.168.1.10:4000\n",
    );
  });

  it("runs npm install then npm run build in sequence", async () => {
    const callOrder = [];

    mockSpawn.mockImplementation((cmd, args) => {
      callOrder.push(`${cmd} ${args.join(" ")}`);
      const listeners = {};
      const child = {
        on: vi.fn((event, cb) => {
          listeners[event] = cb;
        }),
      };
      setTimeout(() => listeners.close?.(0), 0);
      return child;
    });

    await scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" });

    expect(callOrder).toEqual(["npm install", "npm run build"]);
  });

  it("passes targetDir as cwd to spawn", async () => {
    await scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" });

    for (const call of mockSpawn.mock.calls) {
      expect(call[2]).toEqual(
        expect.objectContaining({ cwd: "/tmp/test-dir" }),
      );
    }
  });

  it("throws when directory already exists (EEXIST)", async () => {
    const eexist = Object.assign(new Error("EEXIST"), { code: "EEXIST" });
    mockMkdir.mockRejectedValueOnce(eexist);

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("Target directory already exists");
  });

  it("does not attempt cleanup when EEXIST (dir is pre-existing)", async () => {
    const eexist = Object.assign(new Error("EEXIST"), { code: "EEXIST" });
    mockMkdir.mockRejectedValueOnce(eexist);

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow();

    expect(mockRm).not.toHaveBeenCalled();
  });

  it("re-throws non-EEXIST mkdir errors", async () => {
    const eperm = Object.assign(new Error("EPERM"), { code: "EPERM" });
    mockMkdir.mockRejectedValueOnce(eperm);

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("EPERM");
  });

  it("cleans up on copy failure", async () => {
    mockCp.mockRejectedValueOnce(new Error("copy failed"));

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("copy failed");

    expect(mockRm).toHaveBeenCalledWith("/tmp/test-dir", {
      recursive: true,
      force: true,
    });
  });

  it("cleans up on npm install failure", async () => {
    mockSpawn.mockImplementation((cmd, args) => {
      const listeners = {};
      const child = {
        on: vi.fn((event, cb) => {
          listeners[event] = cb;
        }),
      };
      if (args.includes("install")) {
        setTimeout(() => listeners.close?.(1), 0);
      } else {
        setTimeout(() => listeners.close?.(0), 0);
      }
      return child;
    });

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("exited with code 1");

    expect(mockRm).toHaveBeenCalledWith("/tmp/test-dir", {
      recursive: true,
      force: true,
    });
  });

  it("cleans up on npm build failure", async () => {
    mockSpawn.mockImplementation((cmd, args) => {
      const listeners = {};
      const child = {
        on: vi.fn((event, cb) => {
          listeners[event] = cb;
        }),
      };
      if (args.includes("build")) {
        setTimeout(() => listeners.close?.(1), 0);
      } else {
        setTimeout(() => listeners.close?.(0), 0);
      }
      return child;
    });

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("exited with code 1");

    expect(mockRm).toHaveBeenCalledWith("/tmp/test-dir", {
      recursive: true,
      force: true,
    });
  });

  it("cleans up on spawn error event", async () => {
    mockSpawn.mockImplementation(() => {
      const listeners = {};
      const child = {
        on: vi.fn((event, cb) => {
          listeners[event] = cb;
        }),
      };
      setTimeout(
        () => listeners.error?.(new Error("ENOENT: npm not found")),
        0,
      );
      return child;
    });

    await expect(
      scaffold({ serverAddress: "host:1234", targetDir: "/tmp/test-dir" }),
    ).rejects.toThrow("npm not found");

    expect(mockRm).toHaveBeenCalledWith("/tmp/test-dir", {
      recursive: true,
      force: true,
    });
  });
});
