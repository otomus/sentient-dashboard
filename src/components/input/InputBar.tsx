import { useState, useRef, useCallback } from "react";
import { sendTask } from "../../client/sentient";
import { useChatStore } from "../../stores/chat";

export function InputBar() {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addUserMessage = useChatStore((s) => s.addUserMessage);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addUserMessage(trimmed, "dashboard");
    sendTask(trimmed);
    setText("");
    inputRef.current?.focus();
  }, [text, addUserMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message to the brain..."
        className="flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm font-[inherit] placeholder:text-[var(--dim)]"
        autoFocus
      />

      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="text-[10px] font-bold tracking-[1px] uppercase px-4 py-2 rounded border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/15 hover:bg-[var(--accent)]/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
      >
        SEND
      </button>
    </div>
  );
}
