"use client";

import { BarVisualizer } from "@livekit/components-react";
import type { AgentState } from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";

interface OrbVisualizerProps {
  agentState: AgentState;
  agentTrack: TrackReferenceOrPlaceholder | undefined;
  isUserSpeaking: boolean;
}

function orbClass(state: AgentState): string {
  if (state === "speaking") return "orb-speaking";
  if (state === "listening") return "orb-listening";
  return "orb-idle";
}

function statusLabel(state: AgentState, isUserSpeaking: boolean): string {
  if (isUserSpeaking) return "Listening";
  switch (state) {
    case "speaking": return "Speaking";
    case "thinking": return "Thinking";
    case "listening": return "Ready";
    case "connecting":
    case "pre-connect-buffering":
    case "initializing": return "Connecting";
    case "failed": return "Failed";
    default: return "Idle";
  }
}

export function OrbVisualizer({ agentState, agentTrack, isUserSpeaking }: OrbVisualizerProps) {
  const isSpeaking = agentState === "speaking";

  return (
    <div className="flex flex-col items-center gap-8 select-none">
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Orbiting rings */}
        <div
          className="ring-1 absolute inset-0 rounded-full border"
          style={{ borderColor: "rgba(30,32,51,0.18)", transformStyle: "preserve-3d" }}
        />
        <div
          className="ring-2 absolute inset-4 rounded-full border"
          style={{ borderColor: "rgba(30,32,51,0.1)", transformStyle: "preserve-3d" }}
        />
        <div
          className="ring-3 absolute inset-8 rounded-full border"
          style={{ borderColor: "rgba(30,32,51,0.06)", transformStyle: "preserve-3d" }}
        />

        {/* Core orb */}
        <div
          className={`absolute inset-10 rounded-full ${orbClass(agentState)}`}
          style={{
            background: isSpeaking
              ? "radial-gradient(circle at 38% 36%, #5a6490, #2e3454 55%, #1e2033)"
              : "radial-gradient(circle at 38% 36%, #4a5593, #2a3060 60%, #1e2033)",
            boxShadow: isSpeaking
              ? "0 0 60px 22px rgba(30,32,51,0.25)"
              : "0 0 30px 8px rgba(30,32,51,0.12)",
          }}
        >
          {agentTrack && isSpeaking && (
            <BarVisualizer
              track={agentTrack}
              barCount={7}
              state={agentState}
              style={{ width: "70%", height: "40%", margin: "auto", marginTop: "28%" }}
            />
          )}
        </div>
      </div>

      <p
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--text-secondary)", letterSpacing: "0.18em" }}
      >
        {statusLabel(agentState, isUserSpeaking)}
      </p>
    </div>
  );
}
