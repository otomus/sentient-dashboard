import { useNeuralStore } from "../../stores/neural";
import { normalizeScore, scoreColor as getScoreColor, statusColor as getStatusColor } from "../../utils/nerve";

interface TestResult {
  passed?: boolean;
  input?: string;
  score?: number;
  reasoning?: string;
}

/** Modal overlay showing detailed nerve information: score, status, system prompt, test results, etc. */
export function NerveDetail() {
  const selectedNerve = useNeuralStore((s) => s.selectedNerve);
  const nerves = useNeuralStore((s) => s.nerves);
  const details = useNeuralStore((s) => s.selectedNerveDetails);
  const loading = useNeuralStore((s) => s.detailsLoading);
  const close = () => {
    useNeuralStore.getState().setSelectedNerve(null);
    useNeuralStore.getState().setSelectedNerveDetails(null);
  };

  if (!selectedNerve) return null;

  const nerve = nerves.find((n) => n.name === selectedNerve);

  const scorePercent = normalizeScore(details?.score ?? nerve?.score ?? 0);
  const nerveScoreColor = getScoreColor(scorePercent);
  const status = nerve?.status ?? "unknown";
  const nerveStatusColor = getStatusColor(status);

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={close}
      />

      <div
        className="fixed z-[70] rounded-xl overflow-hidden flex flex-col"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxHeight: "80vh",
          background: "rgba(14, 14, 22, 0.85)",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(0, 212, 255, 0.25)",
            background: "rgba(10, 10, 16, 0.5)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: nerveStatusColor, boxShadow: `0 0 8px ${nerveStatusColor}` }}
            />
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 700 }}>
              {selectedNerve}
            </span>
          </div>
          <button
            onClick={close}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
          {loading && (
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              Loading details...
            </div>
          )}

          {/* Score */}
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Score
            </span>
            <span style={{ color: nerveScoreColor, fontSize: 20, fontWeight: 800 }}>
              {scorePercent}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              marginBottom: 20,
            }}
          >
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

          {/* Status grid */}
          <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
            <InfoRow label="Status" value={status.toUpperCase()} valueColor={nerveStatusColor} />
            <InfoRow
              label="Qualified"
              value={
                nerve?.qualified === true ? "YES" : nerve?.qualified === false ? "NO" : "PENDING"
              }
              valueColor={
                nerve?.qualified
                  ? "#00ff88"
                  : nerve?.qualified === false
                    ? "#f55b5b"
                    : "rgba(255,255,255,0.5)"
              }
            />
            <InfoRow label="Iteration" value={`${nerve?.iteration ?? 0} / ${nerve?.max_iterations ?? "?"}`} />
          </div>

          {/* Invocation stats from details */}
          {details && (
            <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
              <InfoRow label="Invocations" value={String(details.total_invocations ?? 0)} />
              <InfoRow
                label="Successes"
                value={String(details.successes ?? 0)}
                valueColor="#00ff88"
              />
              <InfoRow
                label="Failures"
                value={String(details.failures ?? 0)}
                valueColor={details.failures ? "#f55b5b" : undefined}
              />
            </div>
          )}

          {/* Description */}
          {details?.description && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Description</SectionLabel>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.5 }}>
                {details.description}
              </div>
            </div>
          )}

          {/* Role */}
          {details?.role && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Role</SectionLabel>
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: "rgba(0, 212, 255,0.12)",
                  border: "1px solid rgba(0, 212, 255,0.25)",
                  color: "#00d4ff",
                  fontWeight: 600,
                }}
              >
                {details.role}
              </span>
            </div>
          )}

          {/* System Prompt */}
          {details?.system_prompt && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>System Prompt</SectionLabel>
              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 11,
                  lineHeight: 1.6,
                  fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  maxHeight: 160,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {details.system_prompt}
              </div>
            </div>
          )}

          {/* Tools */}
          {(details?.tools || nerve?.tools || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Tools</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {(details?.tools || nerve?.tools || []).map((tool) => (
                  <span
                    key={tool}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: "rgba(0, 212, 255, 0.08)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases / Examples */}
          {details?.examples && details.examples.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Test Cases ({details.examples.length})</SectionLabel>
              <div className="flex flex-col gap-2">
                {details.examples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Input
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 11,
                        marginBottom: 6,
                        fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
                      }}
                    >
                      {ex.input}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Expected
                    </div>
                    <div
                      style={{
                        color: "rgba(0, 212, 255, 0.7)",
                        fontSize: 11,
                        fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {ex.output}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results */}
          {details?.test_results && (details.test_results as TestResult[]).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>
                Test Results ({details.pass_count ?? "?"}/{details.test_count ?? "?"})
              </SectionLabel>
              <div className="flex flex-col gap-1">
                {(details.test_results as TestResult[]).map((result, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 4,
                      background: result.passed ? "rgba(0,212,255,0.06)" : "rgba(245,91,91,0.06)",
                      border: `1px solid ${result.passed ? "rgba(0,212,255,0.15)" : "rgba(245,91,91,0.15)"}`,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ marginBottom: result.reasoning ? 4 : 0 }}
                    >
                      <span
                        style={{
                          color: result.passed ? "#00ff88" : "#f55b5b",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {result.passed ? "PASS" : "FAIL"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                        {result.input || `Test ${i + 1}`}
                      </span>
                      {result.score != null && (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 10,
                            marginLeft: "auto",
                          }}
                        >
                          {result.score}%
                        </span>
                      )}
                    </div>
                    {result.reasoning && (
                      <div
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 10,
                          lineHeight: 1.4,
                          marginTop: 2,
                        }}
                      >
                        {result.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ color: valueColor || "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
