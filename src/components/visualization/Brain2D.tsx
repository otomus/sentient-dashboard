import { useMemo } from "react";
import { useNeuralStore } from "../../stores/neural";
import { getClient } from "../../client/sentient";

// Stylized brain outline path
const BRAIN_PATH = "M250,60 C200,60 160,80 140,110 C120,140 110,170 115,200 C105,195 90,200 80,215 C65,235 70,260 85,275 C75,290 75,310 85,325 C95,340 115,350 135,345 C145,365 165,380 190,385 C210,390 235,388 250,380 C265,388 290,390 310,385 C335,380 355,365 365,345 C385,350 405,340 415,325 C425,310 425,290 415,275 C430,260 435,235 420,215 C410,200 395,195 385,200 C390,170 380,140 360,110 C340,80 300,60 250,60";

const FOLD_1 = "M200,120 C220,150 240,140 250,160 C260,140 280,150 300,120";
const FOLD_2 = "M160,180 C180,200 210,185 240,210 C250,200 260,210 290,185 C320,200 340,180 340,180";
const FOLD_3 = "M140,250 C170,240 200,260 230,245 C250,255 270,245 300,260 C330,240 360,250 360,250";
const FOLD_4 = "M170,310 C200,295 230,315 250,305 C270,315 300,295 330,310";
// Brain stem removed per request

const STROKE_DUR = 3;
const NERVE_ANIM_DUR = 1.2;

interface ActiveNerveViz {
  name: string;
  angle: number;
  radius: number;
}

// Generate star positions once
const STARS = Array.from({ length: 120 }, (_, i) => ({
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

// Vertical grid lines — evenly spaced across full width, with perspective taper toward horizon
const GRID_V_COUNT = 40;

export function Brain2D() {
  const nerves = useNeuralStore((s) => s.nerves);
  const activeNerve = useNeuralStore((s) => s.activeNerve);
  const brainState = useNeuralStore((s) => s.brainState);
  const dreamStage = useNeuralStore((s) => s.dreamStage);
  const events = useNeuralStore((s) => s.events);

  const isDreaming = dreamStage !== null;

  const activeNerves = useMemo(() => {
    const now = Date.now();
    const recentNerveNames = new Set<string>();
    if (activeNerve) recentNerveNames.add(activeNerve);
    for (const evt of events) {
      if (evt.nerve && now - evt.timestamp < 30000) {
        recentNerveNames.add(evt.nerve);
      }
    }
    const result: ActiveNerveViz[] = [];
    const names = Array.from(recentNerveNames);
    names.forEach((name, i) => {
      const angle = -90 + (i - (names.length - 1) / 2) * 45;
      result.push({ name, angle, radius: 260 });
    });
    return result;
  }, [activeNerve, events]);

  const stateColor = brainState === "acting" ? "#5bf5a0"
    : brainState === "thinking" ? "#a78bfa"
    : brainState === "responding" ? "#c084fc"
    : "#555568";

  const glowIntensity = brainState === "idle" ? 0 : brainState === "thinking" ? 0.3 : 0.5;

  const handleNerveClick = (name: string) => {
    const store = useNeuralStore.getState();
    store.setSelectedNerve(name);
    store.setDetailsLoading(true);
    store.setSelectedNerveDetails(null);
    getClient()
      .getNerveDetails(name)
      .then((details) => {
        useNeuralStore.getState().setSelectedNerveDetails(details);
        useNeuralStore.getState().setDetailsLoading(false);
      })
      .catch(() => {
        useNeuralStore.getState().setDetailsLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-0" style={{ background: "#0a0a14", overflow: "hidden" }}>
      {/* ===== SYNTHWAVE BACKGROUND ===== */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* Sky gradient — deep navy to purple at horizon */}
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0a18" />
            <stop offset="50%" stopColor="#0d0b1f" />
            <stop offset="80%" stopColor="#1a0e3a" />
            <stop offset="100%" stopColor="#2d1060" />
          </linearGradient>

          {/* Sun gradient — warm center to hot pink edges */}
          <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="30%" stopColor="#ff4080" />
            <stop offset="60%" stopColor="#e040a0" />
            <stop offset="100%" stopColor="#a020c0" />
          </linearGradient>

          {/* Sun glow */}
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#ff4080" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#c040ff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#c040ff" stopOpacity="0" />
          </radialGradient>

          {/* Grid floor gradient — cyan to purple fade */}
          <linearGradient id="grid-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="1" />
            <stop offset="30%" stopColor="#00e5ff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#5bf5a0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
          </linearGradient>

          {/* Horizon glow line */}
          <linearGradient id="horizon-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff4080" stopOpacity="0" />
            <stop offset="20%" stopColor="#ff4080" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#ff4080" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff4080" stopOpacity="0" />
          </linearGradient>

          {/* Clip for sun scan lines */}
          <clipPath id="sun-clip">
            <circle cx="960" cy="810" r="160" />
          </clipPath>

          {/* Clip sun to above horizon */}
          <clipPath id="above-horizon">
            <rect x="0" y="0" width="1920" height="810" />
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
        </defs>

        {/* Sky */}
        <rect width="1920" height="1080" fill="url(#sky-grad)" />

        {/* Stars */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#ffffff" opacity={s.opacity} filter="url(#star-glow)">
            <animate attributeName="opacity" values={`${s.opacity};${s.opacity * 0.3};${s.opacity}`} dur={`${3 + s.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Sun — clipped to above horizon */}
        <g clipPath="url(#above-horizon)">
          {/* Sun glow (behind sun) */}
          <circle cx="960" cy="810" r="300" fill="url(#sun-glow)" />

          {/* Sun body */}
          <circle cx="960" cy="810" r="160" fill="url(#sun-grad)" />

          {/* Sun scan lines */}
          <g clipPath="url(#sun-clip)">
            {Array.from({ length: 20 }, (_, i) => {
              const y = 810 - 160 + i * 17;
              return (
                <rect key={i} x="800" y={y} width="320" height="5" fill="#0a0a18" opacity="0.4" />
              );
            })}
          </g>
        </g>

        {/* Mountain silhouettes — back layer with purple edge glow */}
        <path
          d="M0,810 L200,730 L350,770 L500,700 L650,760 L780,720 L880,790 L960,750 L1040,790 L1140,720 L1270,760 L1400,700 L1550,770 L1700,730 L1920,810 Z"
          fill="#0e0620"
          stroke="#c040ff"
          strokeWidth="2"
          opacity="0.8"
          filter="url(#mountain-glow)"
        />
        {/* Front layer with pink edge glow */}
        <path
          d="M0,810 L150,770 L300,790 L500,740 L700,780 L850,760 L960,780 L1070,760 L1200,780 L1400,740 L1600,790 L1770,770 L1920,810 Z"
          fill="#120830"
          stroke="#ff4080"
          strokeWidth="1.5"
          opacity="0.7"
          filter="url(#mountain-glow)"
        />

        {/* Horizon glow line */}
        <rect x="0" y="807" width="1920" height="6" fill="url(#horizon-glow)" />

        {/* ===== PERSPECTIVE GRID FLOOR ===== */}
        <g>
          {/* Horizontal lines */}
          {GRID_H_LINES.map((y, i) => {
            const opacity = 0.3 + (1 - i / GRID_H_LINES.length) * 0.7;
            return (
              <line key={`h-${i}`} x1="0" y1={y} x2="1920" y2={y} stroke="url(#grid-grad)" strokeWidth={i < 3 ? "2" : "1.5"} opacity={opacity} />
            );
          })}

          {/* Vertical lines — full width, evenly spaced at bottom, converge toward horizon center */}
          {Array.from({ length: GRID_V_COUNT + 1 }, (_, i) => {
            const t = i / GRID_V_COUNT;
            const topX = t * 1920;
            // Fan out from full-width horizon to wider at bottom
            const bottomX = 960 + (topX - 960) * 2.5;
            return (
              <line key={`v-${i}`} x1={topX} y1={HORIZON} x2={bottomX} y2="1080" stroke="url(#grid-grad)" strokeWidth="1.5" opacity={0.6} />
            );
          })}
        </g>

        {/* Grid scroll animation overlay — moving horizontal lines */}
        <g opacity="0.5">
          {[0, 1, 2, 3].map((i) => (
            <line key={`scroll-${i}`} x1="0" x2="1920" stroke="#00e5ff" strokeWidth="2" y1={HORIZON} y2={HORIZON}>
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
      </svg>

      {/* ===== BRAIN SVG (centered, floats above the sun) ===== */}
      <div
        className="fixed inset-0 z-[1] flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 500 500"
          style={{
            width: "min(38vh, 38vw)",
            height: "min(38vh, 38vw)",
            overflow: "visible",
            marginTop: "-8vh",
            pointerEvents: "auto",
          }}
        >
          <defs>
            <linearGradient id="brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#e0d6ff" />
            </linearGradient>

            <filter id="brain-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="nerve-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background glow when active */}
          {brainState !== "idle" && (
            <circle cx="250" cy="250" r="180" fill="none" stroke={stateColor} strokeWidth="1" opacity={glowIntensity}>
              <animate attributeName="r" values="170;190;170" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values={`${glowIntensity};${glowIntensity * 0.5};${glowIntensity}`} dur="3s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Brain outline — two lines chasing each other */}
          {isDreaming ? (
            <>
              {/* DREAM MODE — two pulsing outlines, staggered */}
              <path d={BRAIN_PATH} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#brain-glow)">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;2.5;1" dur="3s" repeatCount="indefinite" />
              </path>
              <path d={BRAIN_PATH} fill="none" stroke="#e0d6ff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="0.5;1.5;0.5" dur="3s" repeatCount="indefinite" />
              </path>
            </>
          ) : (
            <>
              {/* AWAKE MODE — two short dashes chasing around the outline */}
              <path
                d={BRAIN_PATH}
                fill="none"
                stroke="url(#brain-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#brain-glow)"
                strokeDasharray="150 1050"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="1200;0"
                  dur={`${STROKE_DUR}s`}
                  repeatCount="indefinite"
                />
              </path>
              <path
                d={BRAIN_PATH}
                fill="none"
                stroke="#e0d6ff"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                strokeDasharray="150 1050"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="800;-400"
                  dur={`${STROKE_DUR}s`}
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* Internal folds */}
          {[FOLD_1, FOLD_2, FOLD_3, FOLD_4].map((d, i) =>
            isDreaming ? (
              /* DREAM — solid folds with staggered pulse */
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="0.8"
                strokeLinecap="round"
              >
                <animate attributeName="opacity" values="0.15;0.5;0.15" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </path>
            ) : (
              /* AWAKE — stroke-draw */
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.4"
                strokeDasharray="400"
                strokeDashoffset="0"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="400;0;0;400"
                  keyTimes="0;0.35;0.7;1"
                  dur={`${STROKE_DUR}s`}
                  begin={`${0.2 + i * 0.15}s`}
                  repeatCount="indefinite"
                />
              </path>
            )
          )}


          {/* Center pulse dot */}
          <circle cx="250" cy="240" r="3" fill={stateColor} opacity="0.8">
            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Active nerve connections */}
          {activeNerves.map((nv) => {
            const rad = (nv.angle * Math.PI) / 180;
            const nx = 250 + Math.cos(rad) * nv.radius;
            const ny = 240 + Math.sin(rad) * nv.radius;
            const isCurrentActive = nv.name === activeNerve;
            const nerve = nerves.find((n) => n.name === nv.name);
            const statusColor = nerve?.status === "pass" ? "#5bf5a0"
              : nerve?.status === "fail" ? "#f55b5b"
              : nerve?.status === "testing" ? "#f5d05b"
              : "#a78bfa";

            return (
              <g key={nv.name}>
                {/* Synapse beam line */}
                <line
                  x1="250" y1="240" x2={nx} y2={ny}
                  stroke={isCurrentActive ? "#5bf5a0" : "#a78bfa"}
                  strokeWidth={isCurrentActive ? "1.5" : "0.8"}
                  opacity={isCurrentActive ? "0.5" : "0.2"}
                  strokeDasharray="8 4"
                >
                  {isCurrentActive && (
                    <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.8s" repeatCount="indefinite" />
                  )}
                </line>

                {/* Traveling pulse */}
                {isCurrentActive && (
                  <circle r="3" fill="#5bf5a0" filter="url(#nerve-glow)">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path={`M250,240 L${nx},${ny}`} />
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Nerve node */}
                <g onClick={() => handleNerveClick(nv.name)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={nx} cy={ny}
                    r={isCurrentActive ? 14 : 10}
                    fill="none"
                    stroke={statusColor}
                    strokeWidth={isCurrentActive ? "1.5" : "1"}
                    opacity={isCurrentActive ? "0.7" : "0.4"}
                    strokeDasharray="80"
                  >
                    <animate attributeName="stroke-dashoffset" values="80;0" dur={`${NERVE_ANIM_DUR}s`} fill="freeze" />
                    {isCurrentActive && (
                      <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>

                  <circle cx={nx} cy={ny} r="3" fill={statusColor} opacity="0.8">
                    {isCurrentActive && (
                      <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                    )}
                  </circle>

                  {/* Label — stroke-draw then fill */}
                  <text
                    x={nx} y={ny + (nv.angle > 0 ? 28 : -22)}
                    textAnchor="middle" fill="none"
                    stroke={isCurrentActive ? "#5bf5a0" : "rgba(255,255,255,0.6)"}
                    strokeWidth="0.5" fontSize="11"
                    fontFamily="SF Mono, Fira Code, monospace"
                    fontWeight={isCurrentActive ? "700" : "500"}
                    strokeDasharray="200"
                  >
                    {nv.name}
                    <animate attributeName="stroke-dashoffset" values="200;0" dur={`${NERVE_ANIM_DUR}s`} fill="freeze" />
                  </text>
                  <text
                    x={nx} y={ny + (nv.angle > 0 ? 28 : -22)}
                    textAnchor="middle"
                    fill={isCurrentActive ? "#5bf5a0" : "rgba(255,255,255,0.55)"}
                    fontSize="11"
                    fontFamily="SF Mono, Fira Code, monospace"
                    fontWeight={isCurrentActive ? "700" : "500"}
                    opacity="0"
                  >
                    {nv.name}
                    <animate attributeName="opacity" values="0;1" dur="0.3s" begin={`${NERVE_ANIM_DUR}s`} fill="freeze" />
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
