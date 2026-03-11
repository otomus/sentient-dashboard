import { create } from "zustand";
import type { SentientEnvelope } from "@otomus/sentient-sdk";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  envelope?: SentientEnvelope;
  source?: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;

  addUserMessage: (text: string, source?: string) => void;
  addAssistantMessage: (envelope: SentientEnvelope) => void;
  setTyping: (typing: boolean) => void;
  appendAudioToLast: (audioB64: string, mime: string) => void;
}

let msgCounter = 0;

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addUserMessage: (text, source) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${++msgCounter}`,
          role: "user",
          text,
          source,
          timestamp: Date.now(),
        },
      ],
      isTyping: true,
    })),

  addAssistantMessage: (envelope) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${++msgCounter}`,
          role: "assistant",
          text: envelope.content.text,
          envelope,
          timestamp: Date.now(),
        },
      ],
      isTyping: false,
    })),

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
