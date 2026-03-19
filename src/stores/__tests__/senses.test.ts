import { describe, it, expect, beforeEach } from "vitest";
import { useSensesStore } from "../senses";
import { senseCalibrationFactory } from "../../test/factories";
import type { SenseCalibration } from "@otomus/arqitect-sdk";

const initialState = {
  calibration: {},
  configValues: {},
  sightFrame: null,
  sightSource: null,
};

describe("useSensesStore", () => {
  beforeEach(() => {
    useSensesStore.setState(initialState);
  });

  it("has correct initial state", () => {
    const state = useSensesStore.getState();
    expect(state.calibration).toEqual({});
    expect(state.configValues).toEqual({});
    expect(state.sightFrame).toBeNull();
    expect(state.sightSource).toBeNull();
  });

  describe("updateCalibration", () => {
    it("sets calibration data", () => {
      const data: Record<string, SenseCalibration> = {
        vision: senseCalibrationFactory.build(),
      };
      useSensesStore.getState().updateCalibration(data);
      expect(useSensesStore.getState().calibration).toEqual(data);
    });

    it("replaces previous calibration entirely", () => {
      useSensesStore.getState().updateCalibration({ a: senseCalibrationFactory.build() });
      useSensesStore.getState().updateCalibration({ b: senseCalibrationFactory.build() });
      const cal = useSensesStore.getState().calibration;
      expect(cal.b).toBeDefined();
      expect((cal as unknown as Record<string, unknown>).a).toBeUndefined();
    });
  });

  describe("restoreConfig", () => {
    it("merges data into configValues", () => {
      useSensesStore.getState().restoreConfig({ key1: "val1" });
      expect(useSensesStore.getState().configValues).toEqual({ key1: "val1" });
    });

    it("preserves existing keys while adding new ones", () => {
      useSensesStore.getState().restoreConfig({ a: "1" });
      useSensesStore.getState().restoreConfig({ b: "2" });
      expect(useSensesStore.getState().configValues).toEqual({
        a: "1",
        b: "2",
      });
    });

    it("overwrites existing keys with new values", () => {
      useSensesStore.getState().restoreConfig({ a: "1" });
      useSensesStore.getState().restoreConfig({ a: "2" });
      expect(useSensesStore.getState().configValues).toEqual({ a: "2" });
    });

    it("handles empty object without affecting existing values", () => {
      useSensesStore.getState().restoreConfig({ x: "y" });
      useSensesStore.getState().restoreConfig({});
      expect(useSensesStore.getState().configValues).toEqual({ x: "y" });
    });
  });

  describe("setConfigValue", () => {
    it("sets a single config value", () => {
      useSensesStore.getState().setConfigValue("theme", "dark");
      expect(useSensesStore.getState().configValues).toEqual({ theme: "dark" });
    });

    it("preserves other config values", () => {
      useSensesStore.getState().setConfigValue("a", "1");
      useSensesStore.getState().setConfigValue("b", "2");
      expect(useSensesStore.getState().configValues).toEqual({
        a: "1",
        b: "2",
      });
    });

    it("overwrites an existing key", () => {
      useSensesStore.getState().setConfigValue("a", "1");
      useSensesStore.getState().setConfigValue("a", "updated");
      expect(useSensesStore.getState().configValues.a).toBe("updated");
    });
  });

  describe("setSightFrame", () => {
    it("sets sightFrame and sightSource", () => {
      useSensesStore.getState().setSightFrame("imagedata", "camera");
      const state = useSensesStore.getState();
      expect(state.sightFrame).toBe("imagedata");
      expect(state.sightSource).toBe("camera");
    });

    it("defaults sightSource to null when not provided", () => {
      useSensesStore.getState().setSightFrame("imagedata");
      const state = useSensesStore.getState();
      expect(state.sightFrame).toBe("imagedata");
      expect(state.sightSource).toBeNull();
    });

    it("replaces previous frame and source", () => {
      useSensesStore.getState().setSightFrame("frame1", "cam1");
      useSensesStore.getState().setSightFrame("frame2", "cam2");
      const state = useSensesStore.getState();
      expect(state.sightFrame).toBe("frame2");
      expect(state.sightSource).toBe("cam2");
    });

    it("clears source when switching from sourced to unsourced", () => {
      useSensesStore.getState().setSightFrame("frame1", "cam1");
      useSensesStore.getState().setSightFrame("frame2");
      const state = useSensesStore.getState();
      expect(state.sightFrame).toBe("frame2");
      expect(state.sightSource).toBeNull();
    });
  });
});
