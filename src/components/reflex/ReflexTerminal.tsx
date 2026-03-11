import { useEffect, useRef, memo } from "react";
import { useReflexStore, type LogEntry } from "../../stores/reflex";
import { PanelShell } from "../layout/PanelShell";

const colorMap: Record<string, string> = {
  thought: "text-[var(--accent)]",
  action: "text-[var(--accent)]",
  result: "text-[var(--green)]",
  tool: "text-[var(--cyan)]",
  system: "text-[var(--dim)]",
  error: "text-[var(--fire)]",
};

function LogLineRaw({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="py-0.5 animate-[fade-in_0.2s_ease] text-xs">
      <span className="text-[var(--dim)] mr-2">{time}</span>
      <span className={`${colorMap[entry.type] || "text-[var(--dim)]"} mr-1`}>
        [{entry.type.toUpperCase()}]
      </span>
      <span className="text-[var(--text)]">{entry.text}</span>
    </div>
  );
}

const LogLine = memo(LogLineRaw);

export function ReflexTerminal() {
  const logs = useReflexStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <PanelShell title="Reflex Terminal">
      <div ref={scrollRef} className="h-full overflow-y-auto p-3 font-mono">
        {logs.length === 0 && (
          <div className="text-[var(--dim)] text-xs italic">Waiting for activity...</div>
        )}
        {logs.map((entry) => (
          <LogLine key={entry.id} entry={entry} />
        ))}
      </div>
    </PanelShell>
  );
}
