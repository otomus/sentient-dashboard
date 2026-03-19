import { ArqitectClient, Channel } from "@otomus/arqitect-sdk";
import { useConnectionStore } from "../stores/connection";
import { useNeuralStore, type DreamStage } from "../stores/neural";
import { useChatStore } from "../stores/chat";
import { useReflexStore } from "../stores/reflex";
import { useSensesStore } from "../stores/senses";
import { useMemoryStore } from "../stores/memory";
import { useSystemStore } from "../stores/system";

let client: ArqitectClient | null = null;

// Track tasks we sent ourselves so we don't double-show them
const sentTasks = new Set<string>();

/**
 * Returns the singleton ArqitectClient instance.
 * @throws {Error} If {@link initClient} has not been called yet.
 */
export function getClient(): ArqitectClient {
  if (!client) throw new Error("Client not initialized. Call initClient() first.");
  return client;
}

/**
 * Disconnects and destroys the current client so a new one can be created.
 * Safe to call when no client exists.
 */
export function resetClient(): void {
  if (client) {
    client.disconnect();
    client = null;
  }
}

// ────────────────────────────────────────────
// Store accessor shortcuts (resolved once per init, not per event)
// ────────────────────────────────────────────

type StoreAccessors = ReturnType<typeof createStoreAccessors>;

function createStoreAccessors() {
  return {
    conn: useConnectionStore.getState,
    neural: useNeuralStore.getState,
    chat: useChatStore.getState,
    reflex: useReflexStore.getState,
    senses: useSensesStore.getState,
    memory: useMemoryStore.getState,
    system: useSystemStore.getState,
  };
}

// ────────────────────────────────────────────
// Dream-stage mapping
// ────────────────────────────────────────────

const DREAM_STAGES = new Set([
  "qualifying",
  "qualified",
  "qualification_failed",
  "qualification_error",
  "reconciling",
  "reconciliation_start",
  "reconciliation_done",
  "pruning",
  "finetuning",
  "finetuning_start",
  "finetuning_done",
  "personality_reflection",
  "consolidation",
]);

/**
 * Maps a raw server stage string to the DreamStage enum value used by the store.
 * Returns `null` for terminal stages that should clear the dream state.
 */
function toDreamStage(stage: string): DreamStage {
  if (stage === "consolidation" || stage === "reconciliation_start") return "reconciling";
  if (stage === "reconciliation_done" || stage === "finetuning_done") return null;
  if (stage === "finetuning_start") return "finetuning";
  if (stage === "qualification_error") return "qualification_failed";
  return stage as NonNullable<DreamStage>;
}

/**
 * Wraps event data with its channel name to produce a complete raw envelope
 * matching what the server originally sent.
 */
/**
 * Reconstructs the full server message shape (channel + data + timestamp)
 * so the log drawer can display the complete payload.
 */
function rawEnvelope(channel: string, data: unknown): Record<string, unknown> {
  const ts = typeof data === "object" && data !== null && "timestamp" in data
    ? (data as Record<string, unknown>).timestamp
    : undefined;
  return { channel, data, ...(ts !== undefined && { timestamp: ts }) };
}

// ────────────────────────────────────────────
// Channel handler registration
// ────────────────────────────────────────────

/** Registers connection lifecycle handlers. */
function registerConnectionHandlers(c: ArqitectClient, { conn, reflex }: StoreAccessors): void {
  c.on("connected", () => {
    conn().setOnline();
    reflex().log("system", "Connected to Synaptic Bridge");
  });

  c.on("disconnected", () => {
    conn().setOffline();
    reflex().log("error", "Disconnected — reconnecting...");
  });
}

/** Registers brain event handlers (thought, action, response, task, audio). */
function registerBrainHandlers(c: ArqitectClient, { neural, chat, reflex }: StoreAccessors): void {
  c.on(Channel.BRAIN_THOUGHT, (data) => {
    const stage = data.stage;
    const thoughtMsg = (data as unknown as Record<string, string>).message;
    neural().addEvent({ type: "thought", stage, nerve: data.nerve });

    if (DREAM_STAGES.has(stage)) {
      neural().setDream(toDreamStage(stage), data.nerve || null, thoughtMsg || null);
      reflex().log("system", `[DREAM] ${thoughtMsg || stage}${data.nerve ? ` → ${data.nerve}` : ""}`, rawEnvelope(Channel.BRAIN_THOUGHT, data));
    } else {
      if (neural().dreamStage !== null) neural().setDream(null);
      neural().setBrainState(stage === "responding" ? "responding" : "thinking");
      chat().setTyping(true);
    }

    reflex().log("thought", `[${stage}] ${thoughtMsg || data.task || data.nerve || ""}`, rawEnvelope(Channel.BRAIN_THOUGHT, data));
  });

  c.on(Channel.BRAIN_ACTION, (data) => {
    neural().addEvent({ type: "action", nerve: data.nerve });
    if (neural().dreamStage !== null) neural().setDream(null);
    neural().setActiveNerve(data.nerve);
    neural().setBrainState("acting");
    reflex().log("action", `Invoke nerve: ${data.nerve} ${data.args || ""}`, rawEnvelope(Channel.BRAIN_ACTION, data));
  });

  c.on(Channel.BRAIN_RESPONSE, (envelope) => {
    neural().addEvent({ type: "response" });
    if (neural().dreamStage !== null) neural().setDream(null);
    neural().setBrainState("idle");
    neural().setActiveNerve(null);

    const unwrapped = unwrapJsonResponse(envelope);
    chat().addAssistantMessage(unwrapped);
    reflex().log("result", JSON.stringify(unwrapped.content), rawEnvelope(Channel.BRAIN_RESPONSE, envelope));
  });

  c.on(Channel.BRAIN_TASK, (data) => {
    if (data.task && !sentTasks.delete(data.task)) {
      const prefix = data.source && data.source !== "dashboard" ? `[${data.source}] ` : "";
      chat().addUserMessage(`${prefix}${data.task}`, data.source);
    }
  });

  c.on(Channel.BRAIN_AUDIO, (data) => {
    if (data.audio_b64) {
      chat().appendAudioToLast(data.audio_b64, data.audio_mime || "audio/wav");
    }
  });
}

/** Registers nerve event handlers (result, qualification). */
function registerNerveHandlers(c: ArqitectClient, { neural, reflex }: StoreAccessors): void {
  c.on(Channel.NERVE_RESULT, (data) => {
    neural().addEvent({ type: "result", nerve: data.nerve });
    try {
      const parsed = JSON.parse(data.output) as Record<string, string>;
      if (parsed.tool) reflex().log("result", `[${data.nerve}] tool: ${parsed.tool}`, rawEnvelope(Channel.NERVE_RESULT, data));
      reflex().log(
        "result",
        `[${data.nerve}] ${(parsed.response || data.output).substring(0, 200)}`,
        rawEnvelope(Channel.NERVE_RESULT, data),
      );
    } catch {
      // output is not JSON — log raw
      reflex().log("result", `[${data.nerve}] ${data.output.substring(0, 200)}`, rawEnvelope(Channel.NERVE_RESULT, data));
    }
  });

  c.on(Channel.NERVE_QUALIFICATION, (data) => {
    const nerveList = data.nerves || [];
    neural().updateNerves(nerveList);

    const testing = nerveList.filter((n: { status: string }) => n.status === "testing");
    if (testing.length > 0 && !neural().dreamStage) {
      neural().setDream("qualifying", testing[0].name, `Testing ${testing.length} nerve(s)`);
    }
  });

  c.on(Channel.MCP_TOOL_CALL, (data) => {
    if (data.error) {
      reflex().log("error", `[MCP] ${data.tool} ERROR: ${data.error}`, rawEnvelope(Channel.MCP_TOOL_CALL, data));
    } else {
      reflex().log(
        "tool",
        `[MCP] ${data.tool} → ${(data.result_preview || "").substring(0, 120)} (${data.elapsed}s)`,
        rawEnvelope(Channel.MCP_TOOL_CALL, data),
      );
    }
  });
}

/** Registers sense event handlers (status, config, sight, STT). */
function registerSenseHandlers(c: ArqitectClient, { senses, reflex }: StoreAccessors): void {
  c.on(Channel.SENSE_STATUS, (data) => senses().updateCalibration(data));
  c.on(Channel.SENSE_SAVED_CONFIG, (data) => senses().restoreConfig(data));

  c.on(Channel.SENSE_SIGHT_FRAME, (data) => {
    const img = data.image || data.image_b64;
    if (img) senses().setSightFrame(img, data.source);
  });

  c.on(Channel.SENSE_STT_RESULT, (data) => {
    if (data.text) reflex().log("system", `Voice: "${data.text}"`, rawEnvelope(Channel.SENSE_STT_RESULT, data));
  });
}

/** Registers memory, system, and catch-all handlers. */
function registerSystemHandlers(c: ArqitectClient, { memory, system, conn, reflex }: StoreAccessors): void {
  c.on(Channel.MEMORY_STATE, (data) => memory().update(data));
  c.on(Channel.SYSTEM_STATS, (data) => system().update(data));

  // Server sends system:status (not system:stats) with {cpu, memory, uptime}
  c.on(Channel.SYSTEM_STATUS, (data) => {
    system().update(data as unknown as import("@otomus/arqitect-sdk").SystemStats);
  });

  c.on(Channel.SYSTEM_KILL, () => {
    conn().setKilled();
    reflex().log("error", "KILL SWITCH ACTIVATED");
  });
}

/** Channels already handled by dedicated listeners — skip in the catch-all. */
const HANDLED_CHANNELS = new Set<string>([
  Channel.SYSTEM_STATS,
  Channel.SYSTEM_STATUS,
  Channel.SENSE_SIGHT_FRAME,
  Channel.SENSE_STATUS,
  Channel.SENSE_SAVED_CONFIG,
  Channel.BRAIN_THOUGHT,
  Channel.BRAIN_ACTION,
  Channel.BRAIN_RESPONSE,
  Channel.BRAIN_TASK,
  Channel.BRAIN_AUDIO,
  Channel.NERVE_RESULT,
  Channel.NERVE_QUALIFICATION,
  Channel.MCP_TOOL_CALL,
  "connected",
  "disconnected",
]);

/**
 * Registers a catch-all handler that logs any channel not already handled
 * by a dedicated listener (e.g. TOOL-HEAL, ADAPTER-TUNE, CONSOLIDATE).
 */
function registerCatchAllHandler(c: ArqitectClient, { reflex }: StoreAccessors): void {
  c.onAny((channel, data) => {
    if (HANDLED_CHANNELS.has(channel)) return;

    const summary = typeof data === "object" && data !== null
      ? JSON.stringify(data).substring(0, 300)
      : String(data);
    reflex().log("system", `[${channel}] ${summary}`, rawEnvelope(channel, data));
  });
}

// ────────────────────────────────────────────
// JSON response unwrapping
// ────────────────────────────────────────────

interface EnvelopeContent {
  text: string;
  markdown?: boolean;
}

interface EnvelopeLike {
  content: EnvelopeContent;
}

/**
 * Server sometimes wraps text in `{"format":"text","response":"..."}`.
 * Detects and unwraps so chat shows the actual text.
 */
function unwrapJsonResponse<T extends EnvelopeLike>(envelope: T): T {
  const text = envelope.content.text;
  if (!text || !text.startsWith("{")) return envelope;

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.response === "string") {
      return {
        ...envelope,
        content: {
          ...envelope.content,
          text: parsed.response,
          markdown: envelope.content.markdown || parsed.format === "markdown",
        },
      };
    }
  } catch {
    // Not JSON — use as-is
  }
  return envelope;
}

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Creates and connects the singleton ArqitectClient, wiring all channel listeners
 * to the corresponding Zustand stores. No-ops if already initialized.
 *
 * @param url - WebSocket URL to the arqitect-core server (e.g. "ws://host:4000").
 * @returns The connected ArqitectClient instance.
 */
export function initClient(url: string): ArqitectClient {
  if (client) return client;

  client = new ArqitectClient({
    url,
    clientId: "dashboard",
    capabilities: [
      "text",
      "markdown",
      "image",
      "audio",
      "gif",
      "card",
      "actions",
      "reactions",
      "voice_input",
    ],
  });

  const stores = createStoreAccessors();

  registerConnectionHandlers(client, stores);
  registerBrainHandlers(client, stores);
  registerNerveHandlers(client, stores);
  registerSenseHandlers(client, stores);
  registerSystemHandlers(client, stores);
  registerCatchAllHandler(client, stores);

  client.connect();
  return client;
}

/**
 * Sends a task to the agent and records it locally so the returning
 * BRAIN_TASK echo is not duplicated in the chat history.
 *
 * @param text - The task/message text to send.
 */
export function sendTask(text: string): void {
  sentTasks.add(text);
  getClient().send(text);
}
