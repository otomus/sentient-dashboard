import { describe, it, expect, beforeEach } from "vitest";
import { useSystemStore } from "../system";
import { systemStatsFactory } from "../../test/factories";

describe("useSystemStore", () => {
  beforeEach(() => {
    useSystemStore.setState({ stats: null });
  });

  it("has correct initial state", () => {
    expect(useSystemStore.getState().stats).toBeNull();
  });

  describe("update", () => {
    it("sets stats", () => {
      const stats = systemStatsFactory.build({ cpuLoad: 50, memoryUsed: 1024, uptime: 3600 });
      useSystemStore.getState().update(stats);
      expect(useSystemStore.getState().stats).toEqual(stats);
    });

    it("replaces previous stats", () => {
      useSystemStore.getState().update(systemStatsFactory.build({ cpuLoad: 10 }));
      const updated = systemStatsFactory.build({ cpuLoad: 90 });
      useSystemStore.getState().update(updated);
      expect(useSystemStore.getState().stats).toEqual(updated);
    });

    it("can set complex stats objects", () => {
      const stats = systemStatsFactory.build({
        cpuLoad: 75,
        memoryUsed: 2048,
        uptime: 7200,
      });
      useSystemStore.getState().update(stats);
      expect(useSystemStore.getState().stats).toEqual(stats);
    });
  });
});
