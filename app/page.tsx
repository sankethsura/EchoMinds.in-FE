"use client";

import { useState, useCallback, useRef } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { VoiceSession } from "@/components/VoiceSession";
import { PhoneCallTab } from "@/components/PhoneCallTab";
import { InboundCallTab } from "@/components/InboundCallTab";
import { TabSwitcher, type Tab } from "@/components/TabSwitcher";
import { fetchToken, type TokenResponse } from "@/lib/api";

type VoiceState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected"; session: TokenResponse }
  | { status: "error"; message: string };

function TalkButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Start voice session"
      className="relative flex items-center justify-center rounded-full font-bold text-lg tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        width: 160,
        height: 160,
        background: "radial-gradient(circle at 35% 35%, #5f8cff, #2a50cc)",
        boxShadow: "0 0 50px 15px rgba(79,124,255,0.35), 0 8px 32px rgba(0,0,0,0.5)",
        color: "#fff",
      }}
    >
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: "2px solid rgba(79,124,255,0.5)",
          animation: "orb-breathe 2.5s ease-in-out infinite",
        }}
      />
      Talk
    </button>
  );
}

function VoiceChatTab() {
  const [state, setState] = useState<VoiceState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const startSession = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "connecting" });
    try {
      const session = await fetchToken(controller.signal);
      if (!controller.signal.aborted) setState({ status: "connected", session });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState({ status: "error", message: err instanceof Error ? err.message : "Failed to connect" });
    }
  }, []);

  const endSession = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  if (state.status === "connected") {
    return (
      <div className="h-full">
        <LiveKitRoom
          serverUrl={state.session.url}
          token={state.session.token}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={endSession}
          onError={(err) => setState({ status: "error", message: err.message })}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <VoiceSession onEnd={endSession} />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-12 h-full px-6 relative"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Voice Chat
        </h2>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Talk directly with Aria in your browser.
        </p>
      </div>

      <TalkButton onClick={startSession} disabled={state.status === "connecting"} />

      <div className="h-8 flex items-center">
        {state.status === "connecting" && (
          <p className="text-sm animate-pulse" style={{ color: "var(--text-secondary)" }}>
            Connecting…
          </p>
        )}
        {state.status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-red-400">{state.message}</p>
            <button
              onClick={() => setState({ status: "idle" })}
              className="text-xs underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <p className="text-xs absolute bottom-8" style={{ color: "var(--text-secondary)" }}>
        Click Talk and allow microphone access to begin
      </p>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("voice");

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header
        className="flex flex-col items-center gap-4 pt-8 pb-4 px-6 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          EchoMinds
        </h1>
        <TabSwitcher active={activeTab} onChange={setActiveTab} />
      </header>

      {/* Tab content */}
      <div className="flex-1 min-h-0 relative">
        <div className={activeTab === "voice" ? "h-full" : "hidden h-full"}>
          <VoiceChatTab />
        </div>
        <div className={activeTab === "phone" ? "h-full" : "hidden h-full"}>
          <PhoneCallTab />
        </div>
        <div className={activeTab === "inbound" ? "h-full" : "hidden h-full"}>
          <InboundCallTab />
        </div>
      </div>
    </div>
  );
}
