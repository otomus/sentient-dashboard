import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "../../stores/chat";
import { ChatMessage } from "./ChatMessage";
import { sendTask } from "../../client/arqitect";

/** Draggable floating chat widget with message history, typing indicator, and unread badge. */
export function FloatingChat() {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const addUserMessage = useChatStore((s) => s.addUserMessage);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ x: 24, y: 24 }); // bottom-right offset
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Drag handlers
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from the header area
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        px: pos.x,
        py: pos.y,
      };
    },
    [pos],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      // pos is bottom-right offset, so invert the deltas
      setPos({
        x: Math.max(0, dragStart.current.px - dx),
        y: Math.max(0, dragStart.current.py + dy),
      });
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // Send message
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

  // Unread count when closed
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const prevOpenRef = useRef(open);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLastSeenCount(messages.length);
    }
    prevOpenRef.current = open;
  });
  /* eslint-enable react-hooks/set-state-in-effect */
  const unread = open ? 0 : messages.length - lastSeenCount;

  // FAB when collapsed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(0, 212, 255, 0.35)",
        }}
      >
        {/* Chat icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--fire)] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed z-50 flex flex-col"
      style={{
        right: pos.x,
        top: pos.y,
        width: 400,
        height: 520,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 32px)",
      }}
    >
      {/* Glass container */}
      <div
        className="flex flex-col w-full h-full rounded-xl overflow-hidden"
        style={{
          background: "rgba(18, 18, 28, 0.45)",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          backdropFilter: "blur(24px) saturate(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        }}
      >
        {/* Draggable header */}
        <div
          onMouseDown={onDragStart}
          className={`flex items-center justify-between shrink-0 select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(0, 212, 255, 0.25)",
            background: "rgba(10, 10, 16, 0.5)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#00d4ff", boxShadow: "0 0 6px rgba(0, 212, 255, 0.4)" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Chat
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: "rgba(255, 255, 255, 0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="2" y1="12" x2="12" y2="12" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3"
          style={{ padding: "16px 20px" }}
        >
          {messages.length === 0 && (
            <div
              className="text-center mt-8 italic"
              style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: 13 }}
            >
              Send a message to begin.
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div
              className="self-start italic"
              style={{ color: "#00d4ff", fontSize: 12, padding: "4px 12px" }}
            >
              Arqitect is thinking
              <span className="inline-block animate-[blink_1.4s_infinite]">.</span>
              <span className="inline-block animate-[blink_1.4s_infinite_0.2s]">.</span>
              <span className="inline-block animate-[blink_1.4s_infinite_0.4s]">.</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex items-center gap-3 shrink-0"
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(0, 212, 255, 0.25)",
            background: "rgba(10, 10, 16, 0.5)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the brain..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-[inherit]"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer disabled:opacity-30 disabled:cursor-default transition-all"
            style={{
              padding: "8px 16px",
              color: "#ffffff",
              border: "1px solid rgba(0, 212, 255, 0.6)",
              background: "rgba(0, 212, 255, 0.25)",
              fontWeight: 800,
            }}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
