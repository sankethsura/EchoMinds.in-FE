"use client";

import {
  RoomAudioRenderer,
  useConnectionState,
  useRemoteParticipants,
  useVoiceAssistant,
  useTranscriptions,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { OrbVisualizer } from "./OrbVisualizer";
import { TranscriptView } from "./TranscriptView";
import { ConnectionBadge } from "./ConnectionBadge";
import { DebugPanel } from "./DebugPanel";

interface PhoneCallSessionProps {
  phoneNumber: string;
  onEnd: () => void;
}

function CallStatusLabel({
  connectionState,
  agentState,
  phoneParticipantJoined,
}: {
  connectionState: ConnectionState;
  agentState: string;
  phoneParticipantJoined: boolean;
}) {
  if (connectionState !== ConnectionState.Connected) return null;
  if (!phoneParticipantJoined) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: "#fbbf24" }}
        />
        <span className="text-sm" style={{ color: "#fbbf24" }}>
          Dialling…
        </span>
      </div>
    );
  }
  if (agentState === "speaking" || agentState === "listening" || agentState === "thinking") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }}
        />
        <span className="text-sm" style={{ color: "#34d399" }}>
          Call connected
        </span>
      </div>
    );
  }
  return null;
}

export function PhoneCallSession({ phoneNumber, onEnd }: PhoneCallSessionProps) {
  const connectionState = useConnectionState();
  const remoteParticipants = useRemoteParticipants();
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const transcriptions = useTranscriptions();

  const phoneParticipantJoined = remoteParticipants.some(
    (p) => p.identity === "phone-user",
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <RoomAudioRenderer volume={1.0} />

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            EchoMinds
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {phoneNumber}
          </span>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {/* Main */}
      <main className="flex flex-col flex-1 items-center justify-center gap-8 px-6 overflow-hidden">
        <OrbVisualizer
          agentState={agentState}
          agentTrack={audioTrack}
          isUserSpeaking={false}
        />
        <CallStatusLabel
          connectionState={connectionState}
          agentState={agentState}
          phoneParticipantJoined={phoneParticipantJoined}
        />
      </main>

      {/* Transcript */}
      <section
        className="mx-6 mb-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          height: 200,
          maxHeight: "30vh",
        }}
      >
        <div
          className="px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            Transcript
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <TranscriptView segments={transcriptions} localIdentity="phone-user" />
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-center pb-8">
        <button
          onClick={onEnd}
          className="px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#ef4444",
          }}
        >
          End Call
        </button>
      </footer>

      <DebugPanel />
    </div>
  );
}
