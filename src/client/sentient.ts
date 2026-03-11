import { SentientClient, Channel } from "@otomus/sentient-sdk";
import { useConnectionStore } from "../stores/connection";
import { useNeuralStore } from "../stores/neural";
import { useChatStore } from "../stores/chat";
import { useReflexStore } from "../stores/reflex";
import { useSensesStore } from "../stores/senses";
import { useMemoryStore } from "../stores/memory";
import { useSystemStore } from "../stores/system";

let client: SentientClient | null = null;

// Track tasks we sent ourselves so we don't double-show them
const sentTasks = new Set<string>();

export function getClient(): SentientClient {
  if (!client) throw new Error("Client not initialized. Call initClient() first.");
  return client;
}

export function initClient(url: string): SentientClient {
  if (client) return client;

  client = new SentientClient({
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

  const conn = useConnectionStore.getState;
  const neural = useNeuralStore.getState;
  const chat = useChatStore.getState;
  const reflex = useReflexStore.getState;
  const senses = useSensesStore.getState;
  const memory = useMemoryStore.getState;
  const system = useSystemStore.getState;

  // Connection
  client.on("connected", () => {
    conn().setOnline();
    reflex().log("system", "Connected to Synaptic Bridge");
  });

  client.on("disconnected", () => {
    conn().setOffline();
    reflex().log("error", "Disconnected — reconnecting...");
  });

  // Brain events
  const DREAM_STAGES = new Set([
    "qualifying", "qualified", "qualification_failed", "qualification_error",
    "reconciling", "reconciliation_start", "reconciliation_done",
    "pruning", "finetuning", "finetuning_start", "finetuning_done",
    "personality_reflection", "consolidation",
  ]);

  client.on(Channel.BRAIN_THOUGHT, (data) => {
    const stage = data.stage;
    neural().addEvent({ type: "thought", stage, nerve: data.nerve });

    if (DREAM_STAGES.has(stage)) {
      // Map to dream stage
      const dreamStage = stage === "consolidation" || stage === "reconciliation_start" ? "reconciling"
        : stage === "reconciliation_done" || stage === "finetuning_done" ? null
        : stage === "finetuning_start" ? "finetuning"
        : stage === "qualification_error" ? "qualification_failed"
        : stage as any;
      neural().setDream(dreamStage, data.nerve || null, data.message || null);
      reflex().log("system", `[DREAM] ${data.message || stage}${data.nerve ? ` → ${data.nerve}` : ""}`);
    } else {
      neural().setBrainState(stage === "responding" ? "responding" : "thinking");
      chat().setTyping(true);
    }

    reflex().log("thought", `[${stage}] ${data.task || data.nerve || ""}`);
  });

  client.on(Channel.BRAIN_ACTION, (data) => {
    neural().addEvent({ type: "action", nerve: data.nerve });
    neural().setActiveNerve(data.nerve);
    neural().setBrainState("acting");
    reflex().log("action", `Invoke nerve: ${data.nerve} ${data.args || ""}`);
  });

  client.on(Channel.BRAIN_RESPONSE, (envelope) => {
    neural().addEvent({ type: "response" });
    neural().setBrainState("idle");
    neural().setActiveNerve(null);
    chat().addAssistantMessage(envelope);
    reflex().log("result", envelope.content.text.substring(0, 120));
  });

  client.on(Channel.BRAIN_TASK, (data) => {
    if (data.task && !sentTasks.delete(data.task)) {
      const prefix = data.source && data.source !== "dashboard" ? `[${data.source}] ` : "";
      chat().addUserMessage(`${prefix}${data.task}`, data.source);
    }
  });

  client.on(Channel.BRAIN_AUDIO, (data) => {
    if (data.audio_b64) {
      chat().appendAudioToLast(data.audio_b64, data.audio_mime || "audio/wav");
    }
  });

  // Nerves
  client.on(Channel.NERVE_RESULT, (data) => {
    neural().addEvent({ type: "result", nerve: data.nerve });
    try {
      const parsed = JSON.parse(data.output);
      if (parsed.tool) reflex().log("result", `[${data.nerve}] tool: ${parsed.tool}`);
      reflex().log(
        "result",
        `[${data.nerve}] ${(parsed.response || data.output).substring(0, 200)}`,
      );
    } catch {
      reflex().log("result", `[${data.nerve}] ${data.output.substring(0, 200)}`);
    }
  });

  client.on(Channel.NERVE_QUALIFICATION, (data) => {
    const nerveList = data.nerves || [];
    neural().updateNerves(nerveList);

    // Auto-detect dream state from testing nerves
    const testing = nerveList.filter((n: any) => n.status === "testing");
    if (testing.length > 0) {
      const current = neural().dreamStage;
      if (!current) {
        neural().setDream("qualifying", testing[0].name, `Testing ${testing.length} nerve(s)`);
      }
    }
  });

  client.on(Channel.MCP_TOOL_CALL, (data) => {
    if (data.error) {
      reflex().log("error", `[MCP] ${data.tool} ERROR: ${data.error}`);
    } else {
      reflex().log(
        "tool",
        `[MCP] ${data.tool} → ${(data.result_preview || "").substring(0, 120)} (${data.elapsed}s)`,
      );
    }
  });

  // Senses
  client.on(Channel.SENSE_STATUS, (data) => {
    senses().updateCalibration(data);
  });

  client.on(Channel.SENSE_SAVED_CONFIG, (data) => {
    senses().restoreConfig(data);
  });

  client.on(Channel.SENSE_SIGHT_FRAME, (data) => {
    const img = data.image || data.image_b64;
    if (img) senses().setSightFrame(img, data.source);
  });

  client.on(Channel.SENSE_STT_RESULT, (data) => {
    if (data.text) {
      reflex().log("system", `Voice: "${data.text}"`);
    }
  });

  // Memory & System
  client.on(Channel.MEMORY_STATE, (data) => {
    memory().update(data);
  });

  client.on(Channel.SYSTEM_STATS, (data) => {
    system().update(data);
  });

  client.on(Channel.SYSTEM_KILL, () => {
    conn().setKilled();
    reflex().log("error", "KILL SWITCH ACTIVATED");
  });

  client.connect();
  return client;
}

export function sendTask(text: string) {
  sentTasks.add(text);
  getClient().send(text);
}
