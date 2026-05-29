"use client";

import { useEffect, useRef, useState } from "react";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { TranscriptView } from "./TranscriptView";
import { ConnectionBadge } from "./ConnectionBadge";
import { DebugPanel } from "./DebugPanel";
import type { AgentState } from "@livekit/components-react";

interface VoiceSessionProps {
  onEnd: () => void;
}

const AGENT_ACTIVE = new Set<AgentState>(["speaking", "listening", "thinking"]);

function AgentStatusPill({ agentState, isUserSpeaking, timedOut }: { agentState: AgentState; isUserSpeaking: boolean; timedOut: boolean }) {
  if (timedOut) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
        <span className="text-xs" style={{ color: "var(--yellow)" }}>Agent is taking longer than usual…</span>
      </div>
    );
  }
  if (!AGENT_ACTIVE.has(agentState)) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.04)", border: "1px solid var(--border)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--text-tertiary)" }} />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Waiting for agent…</span>
      </div>
    );
  }
  if (isUserSpeaking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.15)" }}>
        <span className="flex gap-0.5 items-end" style={{ height: 12 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-0.5 rounded-full inline-block" style={{ background: "var(--user-color)", height: `${50 + i * 25}%`, animation: `orb-breathe ${0.45 + i * 0.12}s ease-in-out infinite` }} />
          ))}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--user-color)" }}>You're speaking</span>
      </div>
    );
  }
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.04)", border: "1px solid var(--border)" }}>
        <span className="text-xs animate-pulse" style={{ color: "var(--text-tertiary)" }}>Thinking…</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,32,51,0.04)", border: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Listening</span>
    </div>
  );
}

export function VoiceSession({ onEnd }: VoiceSessionProps) {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const { state: agentState } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const [micError, setMicError] = useState<string | null>(null);
  const [agentTimedOut, setAgentTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enable mic — on mobile this must happen inside a user-gesture context.
  // LiveKitRoom's connect={true} handles the audio context unlock, so this is safe.
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

  // Show a warning if the agent hasn't become active within 20 s of connecting
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    if (AGENT_ACTIVE.has(agentState)) {
      setAgentTimedOut(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => setAgentTimedOut(true), 20_000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [connectionState, agentState]);

  const isUserSpeaking = !!(isMicrophoneEnabled && localParticipant?.isSpeaking);

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      {/*
        RoomAudioRenderer must be rendered to play agent audio.
        On iOS Safari the AudioContext is suspended until a user gesture —
        LiveKitRoom's connect flow resumes it automatically when the user
        tapped "Talk", so audio should play without extra handling.
      */}
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
            <span className="text-xs leading-tight" style={{ color: "var(--text-secondary)" }}>AI Voice Assistant</span>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </header>

      {micError && (
        <div
          className="mx-6 mt-3 px-4 py-3 rounded-xl text-sm shrink-0"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "var(--red)",
          }}
        >
          Microphone blocked — allow mic access in your browser settings and reload.
        </div>
      )}

      {/* Timed-out hint — agent worker likely not running */}
      {agentTimedOut && (
        <div
          className="mx-6 mt-3 px-4 py-3 rounded-xl text-sm shrink-0"
          style={{
            background: "rgba(217,119,6,0.07)",
            border: "1px solid rgba(217,119,6,0.2)",
            color: "var(--yellow)",
          }}
        >
          Aria hasn't joined yet. Make sure the agent worker is running, then try again.
        </div>
      )}

      {/* Conversation / transcript */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TranscriptView
          segments={transcriptions}
          localIdentity={localParticipant?.identity ?? ""}
        />
      </div>

      {/* Status row */}
      <div className="flex items-center justify-center px-6 py-2 shrink-0">
        <AgentStatusPill agentState={agentState} isUserSpeaking={isUserSpeaking} timedOut={agentTimedOut && !AGENT_ACTIVE.has(agentState)} />
      </div>

      {/* End call */}
      <footer
        className="flex items-center justify-center pb-8 pt-2 shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={onEnd}
          className="px-8 py-3 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
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
