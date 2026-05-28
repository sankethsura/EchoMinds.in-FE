"use client";

import { useEffect, useState } from "react";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
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

  // Explicitly enable the microphone and log any errors
  useEffect(() => {
    if (!localParticipant) return;

    localParticipant
      .setMicrophoneEnabled(true)
      .then(() => {
        console.log("[EchoMinds] Microphone enabled successfully");
      })
      .catch((err: Error) => {
        console.error("[EchoMinds] Failed to enable microphone:", err);
        setMicError(err.message);
      });
  }, [localParticipant]);

  // Log track state changes
  useEffect(() => {
    if (!microphoneTrack) {
      console.warn("[EchoMinds] No microphone track published yet");
      return;
    }
    console.log(
      "[EchoMinds] Mic track state — sid:", microphoneTrack.trackSid,
      "| muted:", microphoneTrack.isMuted,
      "| kind:", microphoneTrack.kind,
    );
  }, [microphoneTrack]);

  // Log agent state changes
  useEffect(() => {
    console.log("[EchoMinds] Agent state changed →", agentState);
  }, [agentState]);

  // Log agent audio track
  useEffect(() => {
    if (audioTrack) {
      console.log("[EchoMinds] Agent audio track present:", audioTrack);
    } else {
      console.warn("[EchoMinds] No agent audio track yet");
    }
  }, [audioTrack]);

  const isUserSpeaking = isMicrophoneEnabled && localParticipant?.isSpeaking;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Renders all remote audio tracks — must stay mounted */}
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
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            with Aria
          </span>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {/* Mic permission error banner */}
      {micError && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}
        >
          Microphone error: {micError}. Please allow mic access and reload.
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-col flex-1 items-center justify-center gap-10 px-6 overflow-hidden">
        <OrbVisualizer
          agentState={agentState}
          agentTrack={audioTrack}
          isUserSpeaking={!!isUserSpeaking}
        />

        {isUserSpeaking && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-end h-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    background: "var(--user-color)",
                    height: `${60 + i * 20}%`,
                    animation: `orb-breathe ${0.5 + i * 0.15}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--user-color)" }}>
              You&apos;re speaking
            </span>
          </div>
        )}
      </main>

      {/* Transcript panel */}
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
          <TranscriptView
            segments={transcriptions}
            localIdentity={localParticipant?.identity ?? ""}
          />
        </div>
      </section>

      {/* Footer controls */}
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

      {/* Debug overlay */}
      <DebugPanel />
    </div>
  );
}
