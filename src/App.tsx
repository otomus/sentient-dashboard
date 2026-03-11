import { useEffect } from "react";
import { initClient } from "./client/sentient";
import { BrainScene } from "./components/visualization/BrainScene";
import { Header } from "./components/layout/Header";
import { FloatingChat } from "./components/chat/FloatingChat";
import { LogDrawer } from "./components/reflex/LogDrawer";
import { NerveDetail } from "./components/nerves/NerveDetail";
import { DreamPanel } from "./components/nerves/DreamPanel";

export default function App() {
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//localhost:3000`;
    initClient(wsUrl);
  }, []);

  return (
    <>
      {/* Full-page WebGL 3D brain — the star of the show */}
      <BrainScene />

      {/* Minimal header bar */}
      <Header />

      {/* Floating draggable chat widget */}
      <FloatingChat />

      {/* Log drawer from left */}
      <LogDrawer />

      {/* Nerve detail modal */}
      <NerveDetail />

      {/* Dream state panel — shows during qualification/tuning */}
      <DreamPanel />
    </>
  );
}
