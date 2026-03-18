import { useEffect, useState } from "react";
import { initClient } from "./client/sentient";
import { Brain2D } from "./components/visualization/Brain2D";
import { Header } from "./components/layout/Header";
import { CounterBar } from "./components/layout/CounterBar";
import { FloatingChat } from "./components/chat/FloatingChat";
import { LogDrawer } from "./components/reflex/LogDrawer";
import { NerveDetail } from "./components/nerves/NerveDetail";
import { NervesPanel } from "./components/nerves/NervesPanel";
import { DreamPanel } from "./components/nerves/DreamPanel";
import { PerfMonitor } from "./components/layout/PerfMonitor";

/**
 * Root application component. Initializes the WebSocket connection on mount
 * and renders the synthwave dashboard layout: brain visualization, header,
 * counters, chat, log drawer, nerves panel, nerve detail modal, and dream panel.
 */
export default function App() {
  const [nervesOpen, setNervesOpen] = useState(false);

  useEffect(() => {
    const serverAddress = import.meta.env.VITE_SERVER_ADDRESS;
    if (!serverAddress) {
      console.error("VITE_SERVER_ADDRESS is not set — cannot connect to sentient-core server");
      return;
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${serverAddress}`;
    initClient(wsUrl);
  }, []);

  return (
    <>
      {/* 2D SVG Tron disc — center stage */}
      <Brain2D />

      {/* Header bar */}
      <Header />

      {/* Counter widgets under header */}
      <CounterBar onNervesClick={() => setNervesOpen(true)} />

      {/* Chat widget */}
      <FloatingChat />

      {/* Log drawer from left */}
      <LogDrawer />

      {/* Nerves panel — slides from right */}
      <NervesPanel open={nervesOpen} onClose={() => setNervesOpen(false)} />

      {/* Nerve detail modal */}
      <NerveDetail />

      {/* Dream state panel */}
      <DreamPanel />

      {/* Performance monitor */}
      <PerfMonitor />
    </>
  );
}
