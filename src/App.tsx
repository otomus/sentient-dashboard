import { useEffect, useState, useCallback } from "react";
import { initClient, resetClient } from "./client/arqitect";
import { resolveServerAddress } from "./utils/serverAddress";
import { Brain2D } from "./components/visualization/Brain2D";
import { Header } from "./components/layout/Header";
import { CounterBar } from "./components/layout/CounterBar";
import { FloatingChat } from "./components/chat/FloatingChat";
import { LogDrawer } from "./components/reflex/LogDrawer";
import { NerveDetail } from "./components/nerves/NerveDetail";
import { NervesPanel } from "./components/nerves/NervesPanel";
import { DreamPanel } from "./components/nerves/DreamPanel";
import { PerfMonitor } from "./components/layout/PerfMonitor";
import { Footer } from "./components/layout/Footer";
import { WipBanner, WIP_BANNER_HEIGHT } from "./components/layout/WipBanner";

/**
 * Converts a server address into a WebSocket URL.
 * Uses ws:// for localhost (browsers exempt it from mixed-content),
 * wss:// for everything else.
 *
 * @param address - Full ws(s):// URL or host:port.
 * @returns A ws:// or wss:// URL.
 */
function buildWsUrl(address: string): string {
  if (address.startsWith("ws://") || address.startsWith("wss://")) return address;
  const isLocal = /^localhost(:|$)/.test(address) || /^127\.0\.0\.1(:|$)/.test(address);
  const proto = isLocal ? "ws:" : "wss:";
  return `${proto}//${address}`;
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
      {/* WIP banner — matches arqitect-community site */}
      <WipBanner />

      {/* 2D SVG Tron disc — center stage */}
      <Brain2D />

      {/* Header bar with settings cog, offset below banner */}
      <Header onConnect={connectToServer} topOffset={WIP_BANNER_HEIGHT} />

      {/* Counter widgets under header */}
      <CounterBar onNervesClick={() => setNervesOpen(true)} topOffset={WIP_BANNER_HEIGHT} />

      {/* Chat widget */}
      <FloatingChat />

      {/* Log drawer from left */}
      <LogDrawer topOffset={WIP_BANNER_HEIGHT} />

      {/* Nerves panel — slides from right */}
      <NervesPanel open={nervesOpen} onClose={() => setNervesOpen(false)} />

      {/* Nerve detail modal */}
      <NerveDetail />

      {/* Dream state panel */}
      <DreamPanel />

      {/* Performance monitor */}
      <PerfMonitor />

      {/* Footer with social links */}
      <Footer />
    </>
  );
}
