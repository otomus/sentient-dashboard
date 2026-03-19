import { Factory } from "fishery";
import type {
  NerveStatus,
  NerveDetails,
  ArqitectEnvelope,
  SystemStats,
  MemoryState,
  SenseCalibration,
  EnvelopeContent,
} from "@otomus/arqitect-sdk";
import type { ChatMessage } from "../stores/chat";
import type { NeuralEvent } from "../stores/neural";
import type { LogEntry } from "../stores/reflex";

// ────────────────────────────────────────────
// SDK types
// ────────────────────────────────────────────

/** Factory for NerveStatus — the qualification state of a nerve. */
export const nerveStatusFactory = Factory.define<NerveStatus>(({ sequence }) => ({
  name: `nerve-${sequence}`,
  score: 0.85,
  qualified: true,
  status: "pass",
  tools: ["tool-a", "tool-b"],
  iteration: 3,
  max_iterations: 5,
}));

/** Factory for NerveDetails — detailed metadata for a single nerve. */
export const nerveDetailsFactory = Factory.define<NerveDetails>(({ sequence }) => ({
  name: `nerve-${sequence}`,
  description: `Description for nerve-${sequence}`,
  role: "assistant",
  system_prompt: "You are a helpful assistant.",
  examples: [{ input: "hello", output: "Hi there!" }],
  tools: ["tool-a"],
  total_invocations: 42,
  successes: 38,
  failures: 4,
  score: 0.9,
  qualified: true,
}));

/** Factory for EnvelopeContent — text content within a brain response. */
export const envelopeContentFactory = Factory.define<EnvelopeContent>(() => ({
  text: "Hello from the brain.",
  markdown: false,
  tone: "neutral",
}));

/** Factory for ArqitectEnvelope — a complete brain response. */
export const envelopeFactory = Factory.define<ArqitectEnvelope>(({ sequence }) => ({
  id: `env-${sequence}`,
  timestamp: new Date().toISOString(),
  content: envelopeContentFactory.build(),
}));

/** Factory for SystemStats — system resource utilization. */
export const systemStatsFactory = Factory.define<SystemStats>(() => ({
  cpuLoad: 25,
  memoryUsed: 4096,
  totalMem: 16384,
  freeMem: 12288,
  uptime: 3600,
}));

/** Factory for MemoryState — full memory state snapshot. */
export const memoryStateFactory = Factory.define<MemoryState>(() => ({
  session: {},
  conversation: [],
  episodes: [],
  facts: [],
}));

/** Factory for SenseCalibration — calibration state for a sense. */
export const senseCalibrationFactory = Factory.define<SenseCalibration>(() => ({
  status: "ready",
  available: true,
}));

// ────────────────────────────────────────────
// Dashboard store types
// ────────────────────────────────────────────

/** Factory for ChatMessage — a single message in the chat store. */
export const chatMessageFactory = Factory.define<ChatMessage>(({ sequence }) => ({
  id: `msg-${sequence}`,
  role: "user",
  text: `Message ${sequence}`,
  timestamp: Date.now(),
}));

/** Factory for NeuralEvent — a discrete event in the neural processing pipeline. */
export const neuralEventFactory = Factory.define<NeuralEvent>(({ sequence }) => ({
  id: `evt-${sequence}`,
  type: "thought",
  timestamp: Date.now(),
}));

/** Factory for LogEntry — a single reflex log entry. */
export const logEntryFactory = Factory.define<LogEntry>(({ sequence }) => ({
  id: `log-${sequence}`,
  type: "system",
  text: `Log entry ${sequence}`,
  timestamp: Date.now(),
}));
