import { useConnectionStore } from "../../stores/connection";
import { useNeuralStore } from "../../stores/neural";
import { SettingsCog } from "./SettingsCog";

const LETTERS = "ARQITECT".split("");
const LETTER_DUR = 0.4; // seconds per letter draw
const PAUSE = 1.5; // pause after full reveal before reset
const TOTAL_DUR = LETTERS.length * LETTER_DUR + PAUSE;

function ArqitectLogo() {
  return (
    <svg
      width="220"
      height="28"
      viewBox="0 0 220 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="220"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
      </defs>
      {LETTERS.map((letter, i) => {
        const x = i * 25;
        const begin = `${i * LETTER_DUR}s`;
        return (
          <text
            key={i}
            x={x}
            y="20"
            fontFamily="Orbitron, sans-serif"
            fontSize="18"
            fontWeight="900"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="1"
            strokeDasharray="80"
            strokeDashoffset="80"
          >
            {letter}
            <animate
              attributeName="stroke-dashoffset"
              values="80;0;0;80"
              keyTimes={`0;${LETTER_DUR / TOTAL_DUR};${(LETTERS.length * LETTER_DUR) / TOTAL_DUR};1`}
              dur={`${TOTAL_DUR}s`}
              begin={begin}
              repeatCount="indefinite"
            />
          </text>
        );
      })}
    </svg>
  );
}

interface HeaderProps {
  onConnect: (address: string) => void;
}

/** Top navigation bar with animated ARQITECT logo, connection status, and settings cog. */
export function Header({ onConnect }: HeaderProps) {
  const status = useConnectionStore((s) => s.status);
  const dreamStage = useNeuralStore((s) => s.dreamStage);

  const isDreaming = dreamStage !== null;
  const isOnline = status === "online";

  const dotColor = isDreaming ? "#00a8cc" : isOnline ? "#00ff88" : "#f55b5b";

  const statusLabel = isDreaming
    ? "DREAMING"
    : isOnline
      ? "ONLINE"
      : status === "killed"
        ? "KILLED"
        : "OFFLINE";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-2 backdrop-blur-md"
      style={{
        paddingLeft: 64,
        paddingRight: 64,
        paddingTop: 16,
        paddingBottom: 16,
        background: "rgba(5, 5, 16, 0.6)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.15)",
      }}
    >
      <ArqitectLogo />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
              animation: isDreaming
                ? "pulse-dot 3s ease-in-out infinite"
                : isOnline
                  ? "pulse-dot 2s ease-in-out infinite"
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: "Orbitron, sans-serif",
              color: isDreaming ? "#00a8cc" : "rgba(224, 224, 240, 0.7)",
            }}
          >
            {statusLabel}
          </span>
        </div>
        <SettingsCog onConnect={onConnect} />
      </div>
    </header>
  );
}
