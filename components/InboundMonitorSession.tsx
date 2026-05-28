"use client";

import {
  RoomAudioRenderer,
  useConnectionState,
  useVoiceAssistant,
  useTranscriptions,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { TranscriptView } from "./TranscriptView";
import { ConnectionBadge } from "./ConnectionBadge";
import type { AgentState } from "@livekit/components-react";

interface InboundMonitorSessionProps {
  roomName: string;
  onStop: () => void;
}

function AgentStatusPill({ agentState }: { agentState: AgentState }) {
  if (agentState === "speaking") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.06)", border: "1px solid var(--border)" }}>
        <span className="flex gap-0.5 items-end" style={{ height: 12 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-0.5 rounded-full inline-block" style={{ background: "var(--agent-color)", height: `${50 + i * 25}%`, animation: `orb-breathe ${0.45 + i * 0.12}s ease-in-out infinite` }} />
          ))}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--agent-color)" }}>Aria is speaking</span>
      </div>
    );
  }
  if (agentState === "thinking") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.04)", border: "1px solid var(--border)" }}>
        <span className="text-xs animate-pulse" style={{ color: "var(--text-tertiary)" }}>Thinking…</span>
      </div>
    );
  }
  if (agentState === "listening") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.15)" }}>
        <span className="text-xs" style={{ color: "var(--user-color)" }}>Caller speaking</span>
      </div>
    );
  }
  return (
    <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.04)", border: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Waiting…</span>
    </div>
  );
}

export function InboundMonitorSession({ roomName, onStop }: InboundMonitorSessionProps) {
  const connectionState = useConnectionState();
  const { state: agentState } = useVoiceAssistant();
  const transcriptions = useTranscriptions();

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      <RoomAudioRenderer volume={1.0} />

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(to bottom, #3a3f5c 0%, #1e2033 100%)" }}
          >
            A
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>Aria</span>
            <span className="text-xs leading-tight font-mono" style={{ color: "var(--text-secondary)" }}>{roomName}</span>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {/* Live call badge */}
      {connectionState === ConnectionState.Connected &&
        (agentState === "speaking" || agentState === "listening" || agentState === "thinking") && (
        <div className="flex items-center gap-2 mx-6 mt-3 px-3 py-2 rounded-xl shrink-0"
          style={{ background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)" }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
          <span className="text-xs font-medium" style={{ color: "#059669" }}>Live call in progress</span>
        </div>
      )}

      {/* Conversation / transcript */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-2">
        <TranscriptView segments={transcriptions} localIdentity="" />
      </div>

      {/* Status + stop */}
      <footer
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <AgentStatusPill agentState={agentState} />

        <button
          onClick={onStop}
          className="px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "var(--red)",
          }}
        >
          Stop Monitoring
        </button>
      </footer>
    </div>
  );
}
