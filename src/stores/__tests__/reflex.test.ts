import { describe, it, expect, beforeEach } from "vitest";
import { useReflexStore } from "../reflex";
import { logEntryFactory } from "../../test/factories";

describe("useReflexStore", () => {
  beforeEach(() => {
    useReflexStore.setState({ logs: [] });
  });

  it("has correct initial state", () => {
    const state = useReflexStore.getState();
    expect(state.logs).toEqual([]);
  });

  describe("log", () => {
    it("appends a log entry", () => {
      useReflexStore.getState().log("thought", "thinking...");
      const logs = useReflexStore.getState().logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("thought");
      expect(logs[0].text).toBe("thinking...");
      expect(logs[0].id).toMatch(/^log-\d+$/);
      expect(logs[0].timestamp).toBeGreaterThan(0);
    });

    it("appends multiple log entries in order", () => {
      const store = useReflexStore.getState();
      store.log("action", "doing");
      useReflexStore.getState().log("result", "done");
      const logs = useReflexStore.getState().logs;
      expect(logs).toHaveLength(2);
      expect(logs[0].type).toBe("action");
      expect(logs[1].type).toBe("result");
    });

    it("supports all log types", () => {
      const types = ["thought", "action", "result", "tool", "system", "error"] as const;
      for (const type of types) {
        useReflexStore.getState().log(type, `test-${type}`);
      }
      const logs = useReflexStore.getState().logs;
      expect(logs).toHaveLength(6);
      types.forEach((type, i) => {
        expect(logs[i].type).toBe(type);
      });
    });

    it("caps logs at 501 entries (slices to last 500 then appends 1)", () => {
      const existingLogs = logEntryFactory.buildList(500);
      useReflexStore.setState({ logs: existingLogs });

      useReflexStore.getState().log("error", "overflow");
      const logs = useReflexStore.getState().logs;
      expect(logs).toHaveLength(501);
      expect(logs[500].text).toBe("overflow");
      expect(logs[500].type).toBe("error");
    });

    it("trims when exceeding 500 before appending", () => {
      const existingLogs = logEntryFactory.buildList(600);
      // Override to predictable values
      existingLogs.forEach((log, i) => { log.id = `existing-${i}`; log.text = `log-${i}`; });
      useReflexStore.setState({ logs: existingLogs });

      useReflexStore.getState().log("action", "new-entry");
      const logs = useReflexStore.getState().logs;
      // slice(-500) of 600 = 500, then append 1 = 501
      expect(logs).toHaveLength(501);
      // First entry should be log-100 (600 - 500 = 100)
      expect(logs[0].text).toBe("log-100");
      expect(logs[500].text).toBe("new-entry");
    });

    it("generates unique IDs", () => {
      useReflexStore.getState().log("thought", "a");
      useReflexStore.getState().log("thought", "b");
      const logs = useReflexStore.getState().logs;
      expect(logs[0].id).not.toBe(logs[1].id);
    });
  });

  describe("clear", () => {
    it("empties the logs array", () => {
      useReflexStore.getState().log("thought", "test");
      useReflexStore.getState().log("action", "test2");
      expect(useReflexStore.getState().logs).toHaveLength(2);

      useReflexStore.getState().clear();
      expect(useReflexStore.getState().logs).toEqual([]);
    });

    it("is a no-op on already empty logs", () => {
      useReflexStore.getState().clear();
      expect(useReflexStore.getState().logs).toEqual([]);
    });
  });
});
