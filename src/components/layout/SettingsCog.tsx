import { useState, useRef, useEffect, useCallback } from "react";

const STORAGE_KEY = "arqitect_server_address";

/**
 * Reads the saved server address from localStorage.
 *
 * @returns The stored address string, or an empty string if none is saved.
 */
export function getSavedServerAddress(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

/**
 * Persists a server address to localStorage.
 *
 * @param address - The server address to save (e.g. "localhost:4000").
 */
export function saveServerAddress(address: string): void {
  localStorage.setItem(STORAGE_KEY, address);
}

/**
 * Resolves the effective server address.
 * Checks localStorage first, then falls back to the VITE_SERVER_ADDRESS env var.
 *
 * @returns The resolved address, or an empty string if neither source has a value.
 */
export function resolveServerAddress(): string {
  return getSavedServerAddress() || import.meta.env.VITE_SERVER_ADDRESS || "";
}

interface SettingsCogProps {
  onConnect: (address: string) => void;
}

/** Gear icon button that opens a popover for configuring the server address. */
export function SettingsCog({ onConnect }: SettingsCogProps) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(resolveServerAddress);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-open on first visit when no address is configured
  useEffect(() => {
    if (!resolveServerAddress()) {
      setOpen(true);
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSave = useCallback(() => {
    const trimmed = address.trim();
    if (!trimmed) return;
    saveServerAddress(trimmed);
    onConnect(trimmed);
    setOpen(false);
  }, [address, onConnect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Cog button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors"
        style={{ color: "rgba(224, 224, 240, 0.4)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00d4ff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(224, 224, 240, 0.4)")}
        title="Server settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {/* Settings popover */}
      {open && (
        <div
          className="flex flex-col gap-3"
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: 320,
            padding: "16px 20px",
            background: "rgba(10, 10, 26, 0.95)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: 8,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgba(224, 224, 240, 0.5)",
              fontFamily: "Orbitron, sans-serif",
            }}
          >
            Server Address
          </div>

          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="wss://host:port"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid rgba(0, 212, 255, 0.2)",
              background: "rgba(0,0,0,0.3)",
              color: "#e0e0f0",
              fontSize: 13,
              outline: "none",
              fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.2)")}
          />

          <div className="flex items-center justify-between">
            <span style={{ fontSize: 10, color: "rgba(224, 224, 240, 0.3)" }}>
              {getSavedServerAddress() ? "Connected" : "Not configured"}
            </span>
            <button
              onClick={handleSave}
              disabled={!address.trim()}
              className="text-[10px] font-bold tracking-widest uppercase rounded cursor-pointer disabled:opacity-30 disabled:cursor-default transition-all"
              style={{
                padding: "6px 14px",
                color: "#ffffff",
                border: "1px solid rgba(0, 212, 255, 0.5)",
                background: "rgba(0, 212, 255, 0.2)",
                fontWeight: 800,
              }}
            >
              CONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
