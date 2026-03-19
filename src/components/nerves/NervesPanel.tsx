import { useState, useMemo } from "react";
import { useNeuralStore } from "../../stores/neural";
import { normalizeScore, scoreColor, statusColor, loadNerveDetails } from "../../utils/nerve";
import type { NerveStatus } from "@otomus/arqitect-sdk";

interface NervesPanelProps {
  open: boolean;
  onClose: () => void;
}

type FilterStatus = "all" | "pass" | "fail" | "testing" | "unknown";

/** Slide-out panel listing all nerves with search, filter, and click-to-detail. */
export function NervesPanel({ open, onClose }: NervesPanelProps) {
  const nerves = useNeuralStore((s) => s.nerves);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = nerves;
    if (filter !== "all") list = list.filter((n) => n.status === filter);
    if (search) list = list.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [nerves, filter, search]);

  const filters: { key: FilterStatus; label: string; color: string }[] = [
    { key: "all", label: "All", color: "rgba(255,255,255,0.6)" },
    { key: "pass", label: "Pass", color: "#00ff88" },
    { key: "fail", label: "Fail", color: "#f55b5b" },
    { key: "testing", label: "Testing", color: "#f5d05b" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[55]"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed z-[56] flex flex-col"
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: "90vw",
          background: "rgba(14, 14, 22, 0.92)",
          borderLeft: "1px solid rgba(0, 212, 255, 0.25)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
            background: "rgba(10, 10, 16, 0.5)",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 700 }}>
            Nerves ({nerves.length})
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        {/* Search + Filters */}
        <div style={{ padding: "12px 24px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <input
            type="text"
            placeholder="Search nerves..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(0, 212, 255, 0.15)",
              background: "rgba(0,0,0,0.3)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              outline: "none",
              fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
            }}
          />
          <div className="flex gap-2" style={{ marginTop: 8, paddingBottom: 4 }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="cursor-pointer"
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  border: `1px solid ${filter === f.key ? f.color : "rgba(255,255,255,0.1)"}`,
                  background: filter === f.key ? `${f.color}15` : "transparent",
                  color: filter === f.key ? f.color : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nerve list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "8px 16px" }}>
          {filtered.length === 0 && (
            <div
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 12,
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No nerves found
            </div>
          )}
          {filtered.map((nerve) => (
            <NerveRow key={nerve.name} nerve={nerve} onClick={() => loadNerveDetails(nerve.name)} />
          ))}
        </div>
      </div>
    </>
  );
}

function NerveRow({ nerve, onClick }: { nerve: NerveStatus; onClick: () => void }) {
  const scorePercent = normalizeScore(nerve.score);
  const nerveScoreColor = scoreColor(scorePercent);
  const nerveStatusColor = statusColor(nerve.status);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 4,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0, 212, 255, 0.04)";
        e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: nerveStatusColor,
              boxShadow: `0 0 6px ${nerveStatusColor}`,
              animation:
                nerve.status === "testing" ? "pulse-dot 1.5s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
            }}
          >
            {nerve.name}
          </span>
        </div>
        <span style={{ color: nerveScoreColor, fontSize: 13, fontWeight: 800 }}>
          {scorePercent}%
        </span>
      </div>

      {/* Score bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(scorePercent, 100)}%`,
            background: nerveScoreColor,
            borderRadius: 2,
            transition: "width 0.5s",
          }}
        />
      </div>

      {/* Tools */}
      {nerve.tools.length > 0 && (
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nerve.tools.join(" · ")}
        </div>
      )}
    </div>
  );
}
