import { useState, useEffect, useRef, memo } from "react";
import { useReflexStore, type LogEntry } from "../../stores/reflex";

const typeColors: Record<string, string> = {
  thought: "#a78bfa",
  action: "#c084fc",
  result: "#5bf5a0",
  tool: "#7c5bf5",
  system: "rgba(255,255,255,0.35)",
  error: "#f55b5b",
};

function LogLineRaw({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-xs" style={{ padding: "3px 0", animation: "fade-in 0.2s ease", wordBreak: "break-word", overflowWrap: "break-word" }}>
      <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 8, fontSize: 10 }}>{time}</span>
      <span style={{ color: typeColors[entry.type] || "rgba(255,255,255,0.35)", marginRight: 6, fontSize: 10 }}>
        [{entry.type.toUpperCase()}]
      </span>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{entry.text}</span>
    </div>
  );
}

const LogLine = memo(LogLineRaw);

export function LogDrawer() {
  const [open, setOpen] = useState(false);
  const logs = useReflexStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, open]);

  return (
    <>
      {/* Drawer panel */}
      <div
        className="fixed z-40 flex"
        style={{
          top: 60,
          left: 0,
          bottom: 0,
          width: 420,
          transform: open ? "translateX(0)" : "translateX(-420px)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="flex flex-col w-full h-full"
          style={{
            background: "rgba(18, 18, 28, 0.45)",
            borderRight: "1px solid rgba(91, 245, 160, 0.3)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(91, 245, 160, 0.25)",
              background: "rgba(10, 10, 16, 0.5)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#5bf5a0", boxShadow: "0 0 6px rgba(91, 245, 160, 0.4)" }}
              />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                Reflex Log
              </span>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {logs.length}
            </span>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto font-mono"
            style={{ padding: "12px 20px" }}
          >
            {logs.length === 0 && (
              <div className="italic" style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 32, textAlign: "center" }}>
                Waiting for activity...
              </div>
            )}
            {logs.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              padding: "10px 20px",
              borderTop: "1px solid rgba(91, 245, 160, 0.25)",
              background: "rgba(10, 10, 16, 0.5)",
            }}
          >
            <button
              onClick={() => useReflexStore.getState().clear()}
              className="text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer transition-all"
              style={{
                padding: "6px 12px",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>

      {/* Tab toggle — visible when drawer is closed */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed z-50 cursor-pointer transition-all"
        style={{
          top: "50%",
          left: open ? 420 : 0,
          transform: "translateY(-50%)",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "12px 6px",
          background: "rgba(10, 10, 16, 0.7)",
          borderRight: "1px solid rgba(91, 245, 160, 0.3)",
          borderTop: "1px solid rgba(91, 245, 160, 0.3)",
          borderBottom: "1px solid rgba(91, 245, 160, 0.3)",
          borderRadius: "0 8px 8px 0",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          color: "rgba(91, 245, 160, 0.7)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        {open ? "CLOSE" : "LOGS"}
      </button>
    </>
  );
}
