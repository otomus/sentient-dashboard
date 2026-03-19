import { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chat";
import { ChatMessage } from "./ChatMessage";
import { PanelShell } from "../layout/PanelShell";

export function ChatView() {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  return (
    <PanelShell title="Chat">
      <div ref={scrollRef} className="h-full overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-[var(--dim)] text-xs text-center mt-8 italic">
            No messages yet. Send a task to begin.
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="self-start text-[var(--dim)] text-[11px] italic px-3 py-1">
            Arqitect is thinking
            <span className="inline-block animate-[blink_1.4s_infinite]">.</span>
            <span className="inline-block animate-[blink_1.4s_infinite_0.2s]">.</span>
            <span className="inline-block animate-[blink_1.4s_infinite_0.4s]">.</span>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
