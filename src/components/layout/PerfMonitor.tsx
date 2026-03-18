import { useEffect, useRef, useState } from "react";

const FRAME_BUFFER_SIZE = 60;
const UPDATE_INTERVAL_FRAMES = 30;
const FPS_GOOD_THRESHOLD = 50;
const FPS_WARN_THRESHOLD = 30;
const BYTES_PER_MB = 1048576;

/** Real-time performance overlay showing FPS, frame time, DOM node count, and JS heap usage. */
export function PerfMonitor() {
  const [fps, setFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [domNodes, setDomNodes] = useState(0);
  const [heapMB, setHeapMB] = useState(0);
  const frames = useRef<number[]>([]);
  const rafId = useRef(0);

  useEffect(() => {
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      frames.current.push(delta);
      if (frames.current.length > FRAME_BUFFER_SIZE) frames.current.shift();

      if (frames.current.length % UPDATE_INTERVAL_FRAMES === 0) {
        const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
        setFps(Math.round(1000 / avg));
        setRenderTime(Math.round(avg * 10) / 10);
        setDomNodes(document.querySelectorAll("*").length);

        const mem = (performance as unknown as Record<string, unknown>).memory as
          | { usedJSHeapSize: number }
          | undefined;
        if (mem) {
          setHeapMB(Math.round(mem.usedJSHeapSize / BYTES_PER_MB));
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const fpsColor = fps >= FPS_GOOD_THRESHOLD ? "#00ff88" : fps >= FPS_WARN_THRESHOLD ? "#f5d05b" : "#f55b5b";

  return (
    <div
      className="fixed z-[100]"
      style={{
        bottom: 8,
        right: 8,
        padding: "6px 10px",
        background: "rgba(10, 10, 16, 0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        fontSize: 10,
        fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
        color: "rgba(255,255,255,0.5)",
        display: "flex",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      <span>
        FPS <span style={{ color: fpsColor, fontWeight: 700 }}>{fps}</span>
      </span>
      <span>
        Frame <span style={{ fontWeight: 600 }}>{renderTime}ms</span>
      </span>
      <span>
        DOM <span style={{ fontWeight: 600 }}>{domNodes}</span>
      </span>
      {heapMB > 0 && (
        <span>
          Heap <span style={{ fontWeight: 600 }}>{heapMB}MB</span>
        </span>
      )}
    </div>
  );
}
