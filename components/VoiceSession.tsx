"use client";

import { useEffect, useState } from "react";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import { OrbVisualizer } from "./OrbVisualizer";
import { TranscriptView } from "./TranscriptView";
import { ConnectionBadge } from "./ConnectionBadge";
import { DebugPanel } from "./DebugPanel";

interface VoiceSessionProps {
  onEnd: () => void;
}

export function VoiceSession({ onEnd }: VoiceSessionProps) {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(true).catch((err: Error) => {
      console.error("[EchoMinds] Failed to enable microphone:", err);
      setMicError(err.message);
    });
  }, [localParticipant]);

  useEffect(() => {
    if (!microphoneTrack) return;
    console.log("[EchoMinds] Mic track —", microphoneTrack.trackSid);
  }, [microphoneTrack]);

  useEffect(() => {
    console.log("[EchoMinds] Agent state →", agentState);
  }, [agentState]);

  const isUserSpeaking = isMicrophoneEnabled && localParticipant?.isSpeaking;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <RoomAudioRenderer volume={1.0} />

      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            EchoMinds
          </span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>· Aria</span>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {micError && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "var(--red)",
          }}
        >
          Microphone error: {micError}. Allow mic access and reload.
        </div>
      )}

      <main className="flex flex-col flex-1 items-center justify-center gap-8 px-6 overflow-hidden">
        <OrbVisualizer
          agentState={agentState}
          agentTrack={audioTrack}
          isUserSpeaking={!!isUserSpeaking}
        />

        {isUserSpeaking && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-end h-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    background: "var(--user-color)",
                    height: `${55 + i * 20}%`,
                    animation: `orb-breathe ${0.5 + i * 0.15}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--user-color)" }}>
              Speaking
            </span>
          </div>
        )}
      </main>

      {/* Transcript panel */}
      <section
        className="mx-6 mb-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-card)",
          height: 200,
          maxHeight: "30vh",
        }}
      >
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.15em" }}
          >
            Transcript
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <TranscriptView
            segments={transcriptions}
            localIdentity={localParticipant?.identity ?? ""}
          />
        </div>
      </section>

      <footer className="flex items-center justify-center pb-8 shrink-0">
        <button
          onClick={onEnd}
          className="px-8 py-3 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "var(--red)",
          }}
        >
          End Call
        </button>
      </footer>

      <DebugPanel />
    </div>
  );
}
