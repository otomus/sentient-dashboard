import { create } from "zustand";
import type { ArqitectEnvelope } from "@otomus/arqitect-sdk";

/**
 * A single message in the chat history.
 * @property id - Auto-incrementing unique identifier (e.g. "msg-1").
 * @property role - Whether the message is from the user or the assistant.
 * @property text - Plain-text content of the message.
 * @property envelope - Full SDK envelope for assistant messages (contains media, metadata).
 * @property source - Origin client identifier (e.g. "dashboard", "telegram").
 * @property timestamp - Unix epoch milliseconds when the message was created.
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  envelope?: ArqitectEnvelope;
  source?: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;

  addUserMessage: (text: string, source?: string) => void;
  addAssistantMessage: (envelope: ArqitectEnvelope) => void;
  setTyping: (typing: boolean) => void;
  appendAudioToLast: (audioB64: string, mime: string) => void;
}

let msgCounter = 0;
const MAX_MESSAGES = 500;

/**
 * Zustand store managing chat messages and typing indicator.
 * Supports user and assistant messages, and appending audio to the last assistant response.
 */
export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addUserMessage: (text, source) =>
    set((state) => {
      const messages: ChatMessage[] = [
        ...state.messages,
        {
          id: `msg-${++msgCounter}`,
          role: "user" as const,
          text,
          source,
          timestamp: Date.now(),
        },
      ];
      return { messages: messages.slice(-MAX_MESSAGES), isTyping: true };
    }),

  addAssistantMessage: (envelope) =>
    set((state) => {
      const messages: ChatMessage[] = [
        ...state.messages,
        {
          id: `msg-${++msgCounter}`,
          role: "assistant" as const,
          text: envelope.content.text,
          envelope,
          timestamp: Date.now(),
        },
      ];
      return { messages: messages.slice(-MAX_MESSAGES), isTyping: false };
    }),

  setTyping: (typing) => set({ isTyping: typing }),

  appendAudioToLast: (audioB64, mime) =>
    set((state) => {
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant" && messages[i].envelope) {
          const msg = { ...messages[i] };
          const envelope = { ...msg.envelope! };
          envelope.media = { ...envelope.media, audio: { data: audioB64, mime } };
          msg.envelope = envelope;
          messages[i] = msg;
          break;
        }
      }
      return { messages };
    }),
}));
