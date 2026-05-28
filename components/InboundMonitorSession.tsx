"use client";

import {
  RoomAudioRenderer,
  useConnectionState,
  useVoiceAssistant,
  useTranscriptions,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { OrbVisualizer } from "./OrbVisualizer";
import { TranscriptView } from "./TranscriptView";
import { ConnectionBadge } from "./ConnectionBadge";

interface InboundMonitorSessionProps {
  roomName: string;
  onStop: () => void;
}

export function InboundMonitorSession({ roomName, onStop }: InboundMonitorSessionProps) {
  const connectionState = useConnectionState();
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const transcriptions = useTranscriptions();

  const statusLabel =
    connectionState === ConnectionState.Connected
      ? agentState === "speaking" || agentState === "listening" || agentState === "thinking"
        ? "Call in progress"
        : "Waiting for agent…"
      : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <RoomAudioRenderer volume={1.0} />

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-base font-semibold"
            style={{
              background: "linear-gradient(135deg, #c084fc, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            EchoMinds
          </span>
          <span className="text-xs font-mono truncate max-w-[160px]" style={{ color: "var(--text-secondary)" }}>
            · {roomName}
          </span>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {/* Main */}
      <main className="flex flex-col flex-1 items-center justify-center gap-6 px-6 overflow-hidden">
        <OrbVisualizer agentState={agentState} agentTrack={audioTrack} isUserSpeaking={false} />
        {statusLabel && (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }}
            />
            <span className="text-sm" style={{ color: "#34d399" }}>
              {statusLabel}
            </span>
          </div>
        )}
      </main>

      {/* Transcript */}
      <section
        className="mx-6 mb-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          height: 200,
          maxHeight: "30vh",
        }}
      >
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            Transcript
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <TranscriptView segments={transcriptions} localIdentity="" />
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-center pb-8">
        <button
          onClick={onStop}
          className="px-8 py-3 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "var(--red)",
          }}
        >
          Stop Monitoring
        </button>
      </footer>
    </div>
  );
}
