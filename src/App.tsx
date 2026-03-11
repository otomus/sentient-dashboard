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

export default function App() {
  const [nervesOpen, setNervesOpen] = useState(false);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//localhost:3000`;
    initClient(wsUrl);
  }, []);

  return (
    <>
      {/* 2D SVG brain — center stage */}
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
    </>
  );
}
