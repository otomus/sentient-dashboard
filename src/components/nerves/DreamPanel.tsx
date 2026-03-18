import { useMemo } from "react";
import { useNeuralStore, type DreamStage } from "../../stores/neural";

const stageLabels: Record<NonNullable<DreamStage>, { label: string; color: string }> = {
  qualifying: { label: "QUALIFYING", color: "#f5d05b" },
  qualified: { label: "QUALIFIED", color: "#00ff88" },
  qualification_failed: { label: "QUALIFICATION FAILED", color: "#f55b5b" },
  reconciling: { label: "RECONCILING", color: "#00d4ff" },
  pruning: { label: "PRUNING", color: "#f55b5b" },
  finetuning: { label: "FINE-TUNING", color: "#00a8cc" },
  personality_reflection: { label: "REFLECTING", color: "#00ff88" },
};

/** Bottom-center panel showing active dream state and nerve testing progress. */
export function DreamPanel() {
  const dreamStage = useNeuralStore((s) => s.dreamStage);
  const dreamNerve = useNeuralStore((s) => s.dreamNerve);
  const dreamMessage = useNeuralStore((s) => s.dreamMessage);
  const nerves = useNeuralStore((s) => s.nerves);

  // Find nerves currently being tested
  const testingNerves = useMemo(() => nerves.filter((n) => n.status === "testing"), [nerves]);

  // Show panel if dream stage is active OR if any nerves are testing
  if (!dreamStage && testingNerves.length === 0) return null;

  const info = dreamStage
    ? stageLabels[dreamStage] || { label: dreamStage.toUpperCase(), color: "#00d4ff" }
    : { label: "QUALIFYING", color: "#00d4ff" };

  return (
    <div
      className="fixed z-40 flex flex-col"
      style={{
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        width: 480,
        maxWidth: "calc(100vw - 48px)",
        background: "rgba(14, 14, 22, 0.85)",
        border: `1px solid ${info.color}40`,
        borderRadius: 12,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${info.color}15`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${info.color}25`,
          background: "rgba(10, 10, 16, 0.5)",
        }}
      >
        {/* Pulsing indicator */}
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: info.color,
            boxShadow: `0 0 8px ${info.color}`,
            animation: "pulse-dot 1.5s ease-in-out infinite",
          }}
        />
        <span style={{ color: info.color, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          DREAM STATE
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>—</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>
          {info.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 20px" }}>
        {/* Current nerve being tuned */}
        {dreamNerve && (
          <div className="flex items-center gap-2" style={{ marginBottom: dreamMessage ? 10 : 0 }}>
            <span
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Nerve
            </span>
            <span
              style={{
                color: info.color,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
              }}
            >
              {dreamNerve}
            </span>
          </div>
        )}

        {/* Message */}
        {dreamMessage && (
          <div
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: testingNerves.length > 0 ? 12 : 0,
            }}
          >
            {dreamMessage}
          </div>
        )}

        {/* Testing nerves progress */}
        {testingNerves.length > 0 && (
          <div className="flex flex-col gap-2">
            {testingNerves.map((nerve) => {
              const scoreVal = nerve.score > 1 ? nerve.score : Math.round(nerve.score * 100);
              const progressPct =
                nerve.max_iterations > 0
                  ? Math.round((nerve.iteration / nerve.max_iterations) * 100)
                  : 0;

              return (
                <div key={nerve.name}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
                      }}
                    >
                      {nerve.name}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                      iter {nerve.iteration}/{nerve.max_iterations} · {scoreVal}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${progressPct}%`,
                        background: info.color,
                        borderRadius: 2,
                        transition: "width 0.5s ease",
                        boxShadow: `0 0 6px ${info.color}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
