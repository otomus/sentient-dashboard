import { memo } from "react";
import { useNeuralStore } from "../../stores/neural";
import { PanelShell } from "../layout/PanelShell";
import type { NerveStatus } from "@otomus/sentient-sdk";

function NerveCardRaw({ nerve }: { nerve: NerveStatus }) {
  const scorePercent = Math.round(nerve.score * 100);
  const scoreClass =
    scorePercent >= 70 ? "bg-[var(--green)]" : scorePercent >= 40 ? "bg-[var(--yellow)]" : "bg-[var(--fire)]";
  const dotClass =
    nerve.status === "pass"
      ? "bg-[var(--green)] shadow-[0_0_4px_var(--green-glow)]"
      : nerve.status === "fail"
        ? "bg-[var(--fire)] shadow-[0_0_4px_var(--fire-glow)]"
        : nerve.status === "testing"
          ? "bg-[var(--yellow)] animate-[pulse-dot_1s_ease-in-out_infinite]"
          : "bg-[var(--dim)]";

  return (
    <div className="p-2 border border-[var(--glass-border)] rounded bg-[var(--bg)]/40 hover:border-[var(--accent)]/40 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-[11px] font-semibold text-[var(--text)] truncate max-w-[120px]">
            {nerve.name}
          </span>
        </div>
        <span
          className={`text-[11px] font-bold ${
            scorePercent >= 70
              ? "text-[var(--green)]"
              : scorePercent >= 40
                ? "text-[var(--yellow)]"
                : "text-[var(--fire)]"
          }`}
        >
          {scorePercent}%
        </span>
      </div>

      {/* Score bar */}
      <div className="h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreClass}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {nerve.tools.length > 0 && (
        <div className="text-[9px] text-[var(--dim)] mt-1 truncate">
          {nerve.tools.join(", ")}
        </div>
      )}
    </div>
  );
}

const NerveCard = memo(NerveCardRaw);

export function NerveStatusList() {
  const nerves = useNeuralStore((s) => s.nerves);

  return (
    <PanelShell title={`Nerves (${nerves.length})`}>
      <div className="h-full overflow-y-auto p-2 flex flex-col gap-1.5">
        {nerves.length === 0 && (
          <div className="text-[var(--dim)] text-xs italic text-center mt-4">
            No nerves registered
          </div>
        )}
        {nerves.map((nerve) => (
          <NerveCard key={nerve.name} nerve={nerve} />
        ))}
      </div>
    </PanelShell>
  );
}
