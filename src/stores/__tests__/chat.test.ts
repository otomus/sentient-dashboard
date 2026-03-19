import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../chat";
import { envelopeFactory } from "../../test/factories";

const initialState = {
  messages: [] as [],
  isTyping: false,
};

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.setState(initialState);
  });

  it("has correct initial state", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isTyping).toBe(false);
  });

  describe("addUserMessage", () => {
    it("appends a user message and sets isTyping to true", () => {
      useChatStore.getState().addUserMessage("hello");
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe("user");
      expect(state.messages[0].text).toBe("hello");
      expect(state.messages[0].id).toMatch(/^msg-\d+$/);
      expect(state.messages[0].timestamp).toBeGreaterThan(0);
      expect(state.isTyping).toBe(true);
    });

    it("includes optional source", () => {
      useChatStore.getState().addUserMessage("test", "voice");
      expect(useChatStore.getState().messages[0].source).toBe("voice");
    });

    it("source is undefined when not provided", () => {
      useChatStore.getState().addUserMessage("test");
      expect(useChatStore.getState().messages[0].source).toBeUndefined();
    });

    it("appends multiple messages in order", () => {
      useChatStore.getState().addUserMessage("first");
      useChatStore.getState().addUserMessage("second");
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe("first");
      expect(messages[1].text).toBe("second");
    });

    it("generates unique IDs across messages", () => {
      useChatStore.getState().addUserMessage("a");
      useChatStore.getState().addUserMessage("b");
      const messages = useChatStore.getState().messages;
      expect(messages[0].id).not.toBe(messages[1].id);
    });
  });

  describe("addAssistantMessage", () => {
    it("appends an assistant message with text from envelope", () => {
      const envelope = envelopeFactory.build({
        content: { text: "hi there", markdown: false, tone: "neutral" },
      });
      useChatStore.getState().addAssistantMessage(envelope);
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe("assistant");
      expect(state.messages[0].text).toBe("hi there");
      expect(state.messages[0].envelope).toBe(envelope);
      expect(state.messages[0].timestamp).toBeGreaterThan(0);
    });

    it("sets isTyping to false", () => {
      useChatStore.setState({ isTyping: true });
      useChatStore.getState().addAssistantMessage(envelopeFactory.build());
      expect(useChatStore.getState().isTyping).toBe(false);
    });
  });

  describe("setTyping", () => {
    it("sets isTyping to true", () => {
      useChatStore.getState().setTyping(true);
      expect(useChatStore.getState().isTyping).toBe(true);
    });

    it("sets isTyping to false", () => {
      useChatStore.setState({ isTyping: true });
      useChatStore.getState().setTyping(false);
      expect(useChatStore.getState().isTyping).toBe(false);
    });
  });

  describe("appendAudioToLast", () => {
    it("appends audio to the last assistant message with an envelope", () => {
      const envelope = envelopeFactory.build();
      useChatStore.getState().addAssistantMessage(envelope);
      useChatStore.getState().appendAudioToLast("base64data", "audio/mp3");

      const msg = useChatStore.getState().messages[0];
      expect(msg.envelope!.media!.audio).toEqual({
        data: "base64data",
        mime: "audio/mp3",
      });
    });

    it("targets the last assistant message, not earlier ones", () => {
      useChatStore
        .getState()
        .addAssistantMessage(
          envelopeFactory.build({ content: { text: "first", markdown: false, tone: "neutral" } }),
        );
      useChatStore
        .getState()
        .addAssistantMessage(
          envelopeFactory.build({ content: { text: "second", markdown: false, tone: "neutral" } }),
        );
      useChatStore.getState().appendAudioToLast("audio2", "audio/wav");

      const messages = useChatStore.getState().messages;
      expect(messages[0].envelope!.media).toBeUndefined();
      expect(messages[1].envelope!.media!.audio).toEqual({
        data: "audio2",
        mime: "audio/wav",
      });
    });

    it("skips user messages when searching for last assistant", () => {
      useChatStore.getState().addAssistantMessage(envelopeFactory.build());
      useChatStore.getState().addUserMessage("user msg");
      useChatStore.getState().appendAudioToLast("audiodata", "audio/ogg");

      const messages = useChatStore.getState().messages;
      expect(messages[0].envelope!.media!.audio).toEqual({
        data: "audiodata",
        mime: "audio/ogg",
      });
    });

    it("does nothing when there are no assistant messages", () => {
      useChatStore.getState().addUserMessage("just a user");
      useChatStore.getState().appendAudioToLast("audio", "audio/mp3");
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
    });

    it("does nothing when messages array is empty", () => {
      useChatStore.getState().appendAudioToLast("audio", "audio/mp3");
      expect(useChatStore.getState().messages).toEqual([]);
    });
  });
});
