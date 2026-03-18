import { useEffect, useState, useCallback } from "react";
import { initClient, resetClient } from "./client/sentient";
import { resolveServerAddress } from "./components/layout/SettingsCog";
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
 * Converts a server address into a secure WebSocket URL.
 * Accepts full wss:// URLs or plain host:port.
 * Strips ws:// and upgrades to wss:// if provided.
 *
 * @param address - Full wss:// URL or host:port (e.g. "wss://example.com:3000/" or "localhost:4000").
 * @returns A wss:// URL.
 */
function buildWsUrl(address: string): string {
  if (address.startsWith("wss://")) return address;
  const stripped = address.replace(/^wss?:\/\//, "");
  return `wss://${stripped}`;
}

/**
 * Root application component. Resolves server address from localStorage or
 * env var, connects the SDK client, and renders the Tron-style dashboard.
 */
export default function App() {
  const [nervesOpen, setNervesOpen] = useState(false);

  const connectToServer = useCallback((address: string) => {
    resetClient();
    initClient(buildWsUrl(address));
  }, []);

  // Auto-connect on mount if an address is available
  useEffect(() => {
    const address = resolveServerAddress();
    if (address) {
      connectToServer(address);
    }
  }, [connectToServer]);

  return (
    <>
      {/* 2D SVG Tron disc — center stage */}
      <Brain2D />

      {/* Header bar with settings cog */}
      <Header onConnect={connectToServer} />

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
