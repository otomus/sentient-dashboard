import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useReflexStore, type LogEntry } from "../../stores/reflex";

const typeColors: Record<string, string> = {
  thought: "#00d4ff",
  action: "#00ff88",
  result: "#00a8cc",
  tool: "#0088bb",
  system: "rgba(224,224,240,0.35)",
  error: "#f55b5b",
};

function LogLineRaw({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const hasRaw = entry.raw !== undefined;
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div
      style={{
        padding: "3px 0",
        animation: "fade-in 0.2s ease",
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <div
        className="text-xs"
        style={{ cursor: hasRaw ? "pointer" : "default" }}
        onClick={hasRaw ? toggle : undefined}
      >
        <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 8, fontSize: 10 }}>
          {time}
        </span>
        <span
          style={{
            color: typeColors[entry.type] || "rgba(255,255,255,0.35)",
            marginRight: 6,
            fontSize: 10,
          }}
        >
          [{entry.type.toUpperCase()}]
        </span>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{entry.text}</span>
        {hasRaw && (
          <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 6, fontSize: 9 }}>
            {expanded ? "▾" : "▸"}
          </span>
        )}
      </div>
      {expanded && hasRaw && (
        <pre
          style={{
            margin: "4px 0 4px 16px",
            padding: "8px 10px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            color: "rgba(255,255,255,0.6)",
            fontSize: 10,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          {JSON.stringify(entry.raw, null, 2)}
        </pre>
      )}
    </div>
  );
}

const LogLine = memo(LogLineRaw);

interface LogDrawerProps {
  /** Extra top offset in pixels (e.g. to sit below a WIP banner). */
  topOffset?: number;
}

/** Slide-out drawer from the left showing the reflex event log stream. */
export function LogDrawer({ topOffset = 0 }: LogDrawerProps) {
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
          top: 60 + topOffset,
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
            borderRight: "1px solid rgba(0, 212, 255, 0.3)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between shrink-0"
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
              <div
                className="italic"
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 13,
                  marginTop: 32,
                  textAlign: "center",
                }}
              >
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
              borderTop: "1px solid rgba(0, 212, 255, 0.25)",
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
          background: "#00d4ff",
          borderRight: "1px solid #00d4ff",
          borderTop: "1px solid #00d4ff",
          borderBottom: "1px solid #00d4ff",
          borderRadius: "0 8px 8px 0",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          color: "#050510",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 2,
          boxShadow: "0 0 12px rgba(0, 212, 255, 0.3)",
        }}
      >
        {open ? "CLOSE" : "LOGS"}
      </button>
    </>
  );
}
