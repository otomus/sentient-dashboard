import { useMemo, useCallback } from "react";
import { useNeuralStore } from "../../stores/neural";
import { statusColor, loadNerveDetails } from "../../utils/nerve";
import { BRAIN_STATE_COLORS } from "../../utils/colors";

const STROKE_DUR = 3;
const NERVE_ANIM_DUR = 1.2;

/** Disc center — sits on the horizon like a rising Tron disc. */
const DISC_CX = 960;
const DISC_CY = 810;

/** Concentric ring radii for the identity disc. */
const DISC_RINGS = [40, 70, 100, 130, 155];

/** Number of radial segment dividers. */
const SEGMENT_COUNT = 12;

interface ActiveNerveViz {
  name: string;
  angle: number;
  radius: number;
}

// Generate star positions once
const STARS = Array.from({ length: 120 }, () => ({
  cx: Math.random() * 1920,
  cy: Math.random() * 780,
  r: Math.random() * 1.2 + 0.3,
  opacity: Math.random() * 0.6 + 0.2,
  delay: Math.random() * 4,
}));

// Horizon at 75% of viewport height
const HORIZON = 810;

// Perspective grid horizontal lines (closer together near horizon)
const GRID_H_LINES: number[] = [];
for (let i = 0; i < 20; i++) {
  const t = i / 19;
  const y = HORIZON + Math.pow(t, 1.8) * (1080 - HORIZON);
  GRID_H_LINES.push(y);
}

// Vertical grid lines
const GRID_V_COUNT = 40;

// Pre-compute radial segment line endpoints
const SEGMENT_LINES = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const angle = (i / SEGMENT_COUNT) * Math.PI * 2;
  return {
    x1: DISC_CX + Math.cos(angle) * DISC_RINGS[0],
    y1: DISC_CY + Math.sin(angle) * DISC_RINGS[0],
    x2: DISC_CX + Math.cos(angle) * DISC_RINGS[DISC_RINGS.length - 1],
    y2: DISC_CY + Math.sin(angle) * DISC_RINGS[DISC_RINGS.length - 1],
  };
});

// Circuit trace paths between rings (horizontal and vertical through disc center)
const CIRCUIT_TRACES = [
  // Horizontal trace through middle rings
  `M${DISC_CX - DISC_RINGS[2]},${DISC_CY} L${DISC_CX - DISC_RINGS[1]},${DISC_CY}`,
  `M${DISC_CX + DISC_RINGS[1]},${DISC_CY} L${DISC_CX + DISC_RINGS[2]},${DISC_CY}`,
  // Vertical trace
  `M${DISC_CX},${DISC_CY - DISC_RINGS[2]} L${DISC_CX},${DISC_CY - DISC_RINGS[1]}`,
  `M${DISC_CX},${DISC_CY + DISC_RINGS[1]} L${DISC_CX},${DISC_CY + DISC_RINGS[2]}`,
  // Diagonal traces
  `M${DISC_CX - 50},${DISC_CY - 50} L${DISC_CX - 28},${DISC_CY - 28}`,
  `M${DISC_CX + 28},${DISC_CY - 28} L${DISC_CX + 50},${DISC_CY - 50}`,
  `M${DISC_CX - 50},${DISC_CY + 50} L${DISC_CX - 28},${DISC_CY + 28}`,
  `M${DISC_CX + 28},${DISC_CY + 28} L${DISC_CX + 50},${DISC_CY + 50}`,
];

/** Full-screen SVG synthwave background with Tron identity disc and interactive nerve nodes. */
export function Brain2D() {
  const nerves = useNeuralStore((s) => s.nerves);
  const activeNerve = useNeuralStore((s) => s.activeNerve);
  const brainState = useNeuralStore((s) => s.brainState);
  const dreamStage = useNeuralStore((s) => s.dreamStage);
  const eventsLength = useNeuralStore((s) => s.events.length);

  const isDreaming = dreamStage !== null;

  const activeNerves = useMemo(() => {
    const events = useNeuralStore.getState().events;
    const recentNerveNames = new Set<string>();
    if (activeNerve) recentNerveNames.add(activeNerve);
    const recent = events.slice(-10);
    for (const evt of recent) {
      if (evt.nerve) {
        recentNerveNames.add(evt.nerve);
      }
    }
    const result: ActiveNerveViz[] = [];
    const names = Array.from(recentNerveNames);
    names.forEach((name, i) => {
      // Spread nerves in an arc above the disc (-150° to -30°, i.e. upward fan)
      const arcSpan = 120;
      const arcStart = -150;
      const step = names.length > 1 ? arcSpan / (names.length - 1) : 0;
      const angle = arcStart + i * step;
      result.push({ name, angle, radius: 300 });
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNerve, eventsLength]);

  const stateColor = BRAIN_STATE_COLORS[brainState] || BRAIN_STATE_COLORS.idle;
  const glowIntensity = brainState === "idle" ? 0 : brainState === "thinking" ? 0.3 : 0.5;

  const handleNerveClick = useCallback((name: string) => {
    loadNerveDetails(name);
  }, []);

  return (
    <div className="fixed inset-0 z-0" style={{ background: "#050510", overflow: "hidden" }}>
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050510" />
            <stop offset="50%" stopColor="#0a0a1a" />
            <stop offset="80%" stopColor="#0a1530" />
            <stop offset="100%" stopColor="#0d2040" />
          </linearGradient>

          {/* Disc glow — replaces sun glow */}
          <radialGradient id="disc-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.35" />
            <stop offset="30%" stopColor="#00d4ff" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#00ff88" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>

          {/* Grid floor gradient */}
          <linearGradient id="grid-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
            <stop offset="30%" stopColor="#00d4ff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#00ff88" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.15" />
          </linearGradient>

          {/* Horizon glow line */}
          <linearGradient id="horizon-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="20%" stopColor="#00d4ff" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#00ff88" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#00d4ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>

          {/* Disc ring gradient */}
          <linearGradient id="disc-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#00ff88" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>

          {/* Clip to above horizon */}
          <clipPath id="above-horizon">
            <rect x="0" y="0" width="1920" height={HORIZON} />
          </clipPath>

          {/* Star twinkle filter */}
          <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>

          {/* Mountain edge glow */}
          <filter id="mountain-glow" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Disc element glow */}
          <filter id="disc-element-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Nerve glow */}
          <filter id="nerve-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Sky */}
        <rect width="1920" height="1080" fill="url(#sky-grad)" />

        {/* Stars */}
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#ffffff"
            opacity={s.opacity}
            filter="url(#star-glow)"
          >
            <animate
              attributeName="opacity"
              values={`${s.opacity};${s.opacity * 0.3};${s.opacity}`}
              dur={`${3 + s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* ===== TRON IDENTITY DISC (replaces sun) ===== */}
        <g clipPath="url(#above-horizon)">
          {/* Disc glow aura */}
          <circle cx={DISC_CX} cy={DISC_CY} r="350" fill="url(#disc-glow)" />

          {/* Background glow pulse when active */}
          {brainState !== "idle" && (
            <circle
              cx={DISC_CX}
              cy={DISC_CY}
              r="200"
              fill="none"
              stroke={stateColor}
              strokeWidth="1"
              opacity={glowIntensity}
            >
              <animate attributeName="r" values="190;220;190" dur="3s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values={`${glowIntensity};${glowIntensity * 0.4};${glowIntensity}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Concentric rings */}
          {isDreaming
            ? /* DREAM MODE — pulsing rings */
              DISC_RINGS.map((r, i) => (
                <circle
                  key={`ring-${i}`}
                  cx={DISC_CX}
                  cy={DISC_CY}
                  r={r}
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth={i === DISC_RINGS.length - 1 ? "2" : "1"}
                  filter={i === DISC_RINGS.length - 1 ? "url(#disc-element-glow)" : undefined}
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;0.7;0.2"
                    dur="3s"
                    begin={`${i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-width"
                    values={i === DISC_RINGS.length - 1 ? "1.5;3;1.5" : "0.8;1.5;0.8"}
                    dur="3s"
                    begin={`${i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))
            : /* AWAKE MODE — rings with chasing dash */
              DISC_RINGS.map((r, i) => {
                const circumference = Math.round(2 * Math.PI * r);
                const dashLen = Math.round(circumference * 0.15);
                const gapLen = circumference - dashLen;
                return (
                  <circle
                    key={`ring-${i}`}
                    cx={DISC_CX}
                    cy={DISC_CY}
                    r={r}
                    fill="none"
                    stroke={i === DISC_RINGS.length - 1 ? "url(#disc-ring-grad)" : "#00d4ff"}
                    strokeWidth={i === DISC_RINGS.length - 1 ? "2" : "1"}
                    opacity={0.3 + i * 0.12}
                    strokeDasharray={`${dashLen} ${gapLen}`}
                    filter={i === DISC_RINGS.length - 1 ? "url(#disc-element-glow)" : undefined}
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values={`${circumference};0`}
                      dur={`${STROKE_DUR + i * 0.5}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}

          {/* Radial segment dividers */}
          {SEGMENT_LINES.map((seg, i) => (
            <line
              key={`seg-${i}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#00d4ff"
              strokeWidth="0.5"
              opacity="0.2"
            />
          ))}

          {/* Circuit traces between rings */}
          {CIRCUIT_TRACES.map((d, i) => (
            <path
              key={`trace-${i}`}
              d={d}
              fill="none"
              stroke="#00ff88"
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="6 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-20"
                dur={`${1 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}

          {/* Rotating pulse arc on outer ring */}
          <circle
            cx={DISC_CX}
            cy={DISC_CY}
            r={DISC_RINGS[DISC_RINGS.length - 1]}
            fill="none"
            stroke="#00ff88"
            strokeWidth="2.5"
            opacity="0.6"
            strokeDasharray="60 914"
            filter="url(#disc-element-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="974;0"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Counter-rotating pulse on mid ring */}
          <circle
            cx={DISC_CX}
            cy={DISC_CY}
            r={DISC_RINGS[2]}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="40 588"
            filter="url(#disc-element-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;628"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Center core dot */}
          <circle cx={DISC_CX} cy={DISC_CY} r="6" fill={stateColor} opacity="0.9">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Inner core ring */}
          <circle
            cx={DISC_CX}
            cy={DISC_CY}
            r="18"
            fill="none"
            stroke={stateColor}
            strokeWidth="1"
            opacity="0.5"
          >
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Mountain silhouettes */}
        <path
          d="M0,810 L200,730 L350,770 L500,700 L650,760 L780,720 L880,790 L960,750 L1040,790 L1140,720 L1270,760 L1400,700 L1550,770 L1700,730 L1920,810 Z"
          fill="#050520"
          stroke="#00d4ff"
          strokeWidth="2"
          opacity="0.8"
          filter="url(#mountain-glow)"
        />
        <path
          d="M0,810 L150,770 L300,790 L500,740 L700,780 L850,760 L960,780 L1070,760 L1200,780 L1400,740 L1600,790 L1770,770 L1920,810 Z"
          fill="#0a0a30"
          stroke="#00ff88"
          strokeWidth="1.5"
          opacity="0.7"
          filter="url(#mountain-glow)"
        />

        {/* Horizon glow line */}
        <rect x="0" y="807" width="1920" height="6" fill="url(#horizon-glow)" />

        {/* ===== PERSPECTIVE GRID FLOOR ===== */}
        <g>
          {GRID_H_LINES.map((y, i) => {
            const opacity = 0.3 + (1 - i / GRID_H_LINES.length) * 0.7;
            return (
              <line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2="1920"
                y2={y}
                stroke="url(#grid-grad)"
                strokeWidth={i < 3 ? "2" : "1.5"}
                opacity={opacity}
              />
            );
          })}

          {Array.from({ length: GRID_V_COUNT + 1 }, (_, i) => {
            const t = i / GRID_V_COUNT;
            const topX = t * 1920;
            const bottomX = 960 + (topX - 960) * 2.5;
            return (
              <line
                key={`v-${i}`}
                x1={topX}
                y1={HORIZON}
                x2={bottomX}
                y2="1080"
                stroke="url(#grid-grad)"
                strokeWidth="1.5"
                opacity={0.6}
              />
            );
          })}
        </g>

        {/* Grid scroll animation */}
        <g opacity="0.5">
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`scroll-${i}`}
              x1="0"
              x2="1920"
              stroke="#00d4ff"
              strokeWidth="2"
              y1={HORIZON}
              y2={HORIZON}
            >
              <animate
                attributeName="y1"
                values={`${HORIZON};1080`}
                dur={`${3 + i * 0.8}s`}
                begin={`${i * 0.75}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values={`${HORIZON};1080`}
                dur={`${3 + i * 0.8}s`}
                begin={`${i * 0.75}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0"
                dur={`${3 + i * 0.8}s`}
                begin={`${i * 0.75}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </g>

        {/* ===== NERVE CONNECTIONS FROM DISC ===== */}
        <g style={{ pointerEvents: "auto" }}>
          {activeNerves.map((nv) => {
            const rad = (nv.angle * Math.PI) / 180;
            const nx = DISC_CX + Math.cos(rad) * nv.radius;
            const ny = DISC_CY + Math.sin(rad) * nv.radius;
            const isCurrentActive = nv.name === activeNerve;
            const nerve = nerves.find((n) => n.name === nv.name);
            const nerveColor = statusColor(nerve?.status ?? "unknown");

            return (
              <g key={nv.name}>
                {/* Beam line from disc to nerve */}
                <line
                  x1={DISC_CX}
                  y1={DISC_CY}
                  x2={nx}
                  y2={ny}
                  stroke={isCurrentActive ? "#00ff88" : "#00d4ff"}
                  strokeWidth={isCurrentActive ? "1.5" : "0.8"}
                  opacity={isCurrentActive ? "0.5" : "0.2"}
                  strokeDasharray="8 4"
                >
                  {isCurrentActive && (
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;-24"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>

                {/* Traveling pulse along beam */}
                {isCurrentActive && (
                  <circle r="3" fill="#00ff88" filter="url(#nerve-glow)">
                    <animateMotion
                      dur="1.2s"
                      repeatCount="indefinite"
                      path={`M${DISC_CX},${DISC_CY} L${nx},${ny}`}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;0.3;0.8"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Nerve node */}
                <g onClick={() => handleNerveClick(nv.name)} style={{ cursor: "pointer" }}>
                  <circle cx={nx} cy={ny} r={30} fill="transparent" />
                  <circle
                    cx={nx}
                    cy={ny}
                    r={isCurrentActive ? 14 : 10}
                    fill="none"
                    stroke={nerveColor}
                    strokeWidth={isCurrentActive ? "1.5" : "1"}
                    opacity={isCurrentActive ? "0.7" : "0.4"}
                    strokeDasharray="80"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="80;0"
                      dur={`${NERVE_ANIM_DUR}s`}
                      fill="freeze"
                    />
                    {isCurrentActive && (
                      <animate
                        attributeName="opacity"
                        values="0.5;0.8;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  <circle cx={nx} cy={ny} r="3" fill={nerveColor} opacity="0.8">
                    {isCurrentActive && (
                      <animate
                        attributeName="r"
                        values="2;4;2"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  {/* Label */}
                  <text
                    x={nx}
                    y={ny - 22}
                    textAnchor="middle"
                    fill="none"
                    stroke={isCurrentActive ? "#00ff88" : "rgba(255,255,255,0.6)"}
                    strokeWidth="0.5"
                    fontSize="11"
                    fontFamily="Share Tech Mono, JetBrains Mono, monospace"
                    fontWeight={isCurrentActive ? "700" : "500"}
                    strokeDasharray="200"
                  >
                    {nv.name}
                    <animate
                      attributeName="stroke-dashoffset"
                      values="200;0"
                      dur={`${NERVE_ANIM_DUR}s`}
                      fill="freeze"
                    />
                  </text>
                  <text
                    x={nx}
                    y={ny - 22}
                    textAnchor="middle"
                    fill={isCurrentActive ? "#00ff88" : "rgba(255,255,255,0.55)"}
                    fontSize="11"
                    fontFamily="Share Tech Mono, JetBrains Mono, monospace"
                    fontWeight={isCurrentActive ? "700" : "500"}
                    opacity="0"
                  >
                    {nv.name}
                    <animate
                      attributeName="opacity"
                      values="0;1"
                      dur="0.3s"
                      begin={`${NERVE_ANIM_DUR}s`}
                      fill="freeze"
                    />
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
