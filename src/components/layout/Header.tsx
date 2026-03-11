import { useConnectionStore } from "../../stores/connection";

const LETTERS = "SENTIENT".split("");
const LETTER_DUR = 0.4; // seconds per letter draw
const PAUSE = 1.5; // pause after full reveal before reset
const TOTAL_DUR = LETTERS.length * LETTER_DUR + PAUSE;

function SentientLogo() {
  return (
    <svg width="200" height="28" viewBox="0 0 200 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0d6ff" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {LETTERS.map((letter, i) => {
        const x = i * 22;
        const begin = `${i * LETTER_DUR}s`;
        return (
          <text
            key={i}
            x={x}
            y="20"
            fontFamily="SF Mono, Fira Code, Cascadia Code, monospace"
            fontSize="18"
            fontWeight="700"
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

export function Header() {
  const status = useConnectionStore((s) => s.status);

  const dotClass =
    status === "online"
      ? "bg-[var(--green)] shadow-[0_0_8px_var(--green-glow)] animate-[pulse-dot_2s_ease-in-out_infinite]"
      : "bg-[var(--fire)] shadow-[0_0_8px_var(--fire-glow)]";

  const statusLabel =
    status === "online" ? "ONLINE" : status === "killed" ? "KILLED" : "OFFLINE";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-2 backdrop-blur-md border-b border-[rgba(91,245,160,0.3)]" style={{ paddingLeft: 64, paddingRight: 64, paddingTop: 16, paddingBottom: 16, background: "rgba(10, 10, 15, 0.6)" }}>
      <SentientLogo />

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-[11px] font-semibold tracking-[1px] uppercase text-[var(--text)]/70">
          {statusLabel}
        </span>
      </div>
    </header>
  );
}
