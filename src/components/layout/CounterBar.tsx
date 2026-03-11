import { useNeuralStore } from "../../stores/neural";
import { useMemoryStore } from "../../stores/memory";

interface CounterProps {
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
  sub?: string;
}

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
        minWidth: 120,
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
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span style={{ color, fontSize: 24, fontWeight: 800, fontFamily: "SF Mono, Fira Code, monospace", lineHeight: 1 }}>
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

interface CounterBarProps {
  onNervesClick: () => void;
}

export function CounterBar({ onNervesClick }: CounterBarProps) {
  const nerves = useNeuralStore((s) => s.nerves);
  const brainState = useNeuralStore((s) => s.brainState);
  const events = useNeuralStore((s) => s.events);
  const episodes = useMemoryStore((s) => s.episodes);

  const passCount = nerves.filter((n) => n.status === "pass").length;
  const failCount = nerves.filter((n) => n.status === "fail").length;
  const testingCount = nerves.filter((n) => n.status === "testing").length;

  const stateColors: Record<string, string> = {
    idle: "#555568",
    thinking: "#a78bfa",
    acting: "#5bf5a0",
    responding: "#c084fc",
  };

  return (
    <div
      className="fixed z-30 flex items-center gap-3"
      style={{ top: 80, left: 64, right: 64 }}
    >
      <Counter
        label="Nerves"
        value={nerves.length}
        color="#5bf5a0"
        onClick={onNervesClick}
        sub={passCount > 0 ? `${passCount} pass${failCount ? ` · ${failCount} fail` : ""}${testingCount ? ` · ${testingCount} testing` : ""}` : undefined}
      />
      <Counter
        label="Brain"
        value={brainState.toUpperCase()}
        color={stateColors[brainState] || "#555568"}
      />
      <Counter
        label="Episodes"
        value={episodes.length}
        color="#a78bfa"
      />
      <Counter
        label="Events"
        value={events.length}
        color="#5bc8f5"
        sub="last 100"
      />
    </div>
  );
}
