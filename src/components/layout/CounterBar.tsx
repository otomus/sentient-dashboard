import { useMemo } from "react";
import { useNeuralStore } from "../../stores/neural";
import { useMemoryStore } from "../../stores/memory";
import { useSystemStore } from "../../stores/system";
import { BRAIN_STATE_COLORS } from "../../utils/colors";

interface CounterProps {
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
  sub?: string;
}

/** A single metric counter widget with label, value, and optional sub-text. */
function Counter({ label, value, color, onClick, sub }: CounterProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 20px",
        background: "rgba(14, 14, 22, 0.7)",
        border: `1px solid ${color}25`,
        borderRadius: 10,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
        minWidth: 100,
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = `${color}50`;
        e.currentTarget.style.boxShadow = `0 0 16px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}25`;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          style={{
            color,
            fontSize: 24,
            fontWeight: 800,
            fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

/** Formats a duration in seconds as "Xh Ym" or "Xm". */
function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface CounterBarProps {
  onNervesClick: () => void;
  /** Extra top offset in pixels (e.g. to sit below a WIP banner). */
  topOffset?: number;
}

/** Horizontal bar of metric counters (nerves, brain state, events, system stats). */
export function CounterBar({ onNervesClick, topOffset = 0 }: CounterBarProps) {
  const nerves = useNeuralStore((s) => s.nerves);
  const brainState = useNeuralStore((s) => s.brainState);
  const eventsLength = useNeuralStore((s) => s.events.length);
  const episodes = useMemoryStore((s) => s.episodes);
  const stats = useSystemStore((s) => s.stats);

  const { passCount, failCount, testingCount } = useMemo(() => {
    let pass = 0,
      fail = 0,
      testing = 0;
    for (const n of nerves) {
      if (n.status === "pass") pass++;
      else if (n.status === "fail") fail++;
      else if (n.status === "testing") testing++;
    }
    return { passCount: pass, failCount: fail, testingCount: testing };
  }, [nerves]);

  // Read cpu/memory/uptime from raw stats (server sends {cpu, memory, uptime})
  const raw = stats as unknown as Record<string, number> | null;
  const cpu = raw?.cpu ?? raw?.cpuLoad;
  const mem = raw?.memory ?? raw?.memoryUsed;
  const uptime = raw?.uptime;

  return (
    <div
      className="fixed z-30 flex items-center gap-3 justify-end"
      style={{ top: 80 + topOffset, right: 64, left: 480 }}
    >
      <Counter
        label="Nerves"
        value={nerves.length}
        color="#00ff88"
        onClick={onNervesClick}
        sub={
          passCount > 0
            ? `${passCount} pass${failCount ? ` · ${failCount} fail` : ""}${testingCount ? ` · ${testingCount} testing` : ""}`
            : undefined
        }
      />
      <Counter
        label="Brain"
        value={brainState.toUpperCase()}
        color={BRAIN_STATE_COLORS[brainState] || "#4a4a6a"}
      />
      <Counter label="Episodes" value={episodes.length} color="#00d4ff" />
      <Counter label="Events" value={eventsLength} color="#00a8cc" sub="last 100" />
      {cpu != null && <Counter label="CPU" value={`${Math.round(cpu)}%`} color="#f5d05b" />}
      {mem != null && <Counter label="Memory" value={`${Math.round(mem)}%`} color="#f5a05b" />}
      {uptime != null && <Counter label="Uptime" value={formatUptime(uptime)} color="#00a8cc" />}
    </div>
  );
}
