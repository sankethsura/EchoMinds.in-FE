"use client";

import { useEffect, useState } from "react";
import {
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useVoiceAssistant,
  useTranscriptions,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

export function DebugPanel() {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const { state: agentState, audioTrack, agent } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: ErrorEvent) => {
      setErrors((prev) => [`[JS] ${e.message}`, ...prev].slice(0, 10));
    };
    const unhandled = (e: PromiseRejectionEvent) => {
      setErrors((prev) => [`[Promise] ${e.reason}`, ...prev].slice(0, 10));
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", unhandled);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", unhandled);
    };
  }, []);

  const connLabel: Record<ConnectionState, string> = {
    [ConnectionState.Connected]: "CONNECTED",
    [ConnectionState.Connecting]: "CONNECTING",
    [ConnectionState.Disconnected]: "DISCONNECTED",
    [ConnectionState.Reconnecting]: "RECONNECTING",
    [ConnectionState.SignalReconnecting]: "SIGNAL_RECONNECTING",
  };

  const row = (label: string, value: string, ok?: boolean) => (
    <div key={label} className="flex gap-2 text-xs font-mono">
      <span style={{ color: "#6b7a99", minWidth: 180 }}>{label}</span>
      <span style={{ color: ok === false ? "#f87171" : ok === true ? "#34d399" : "#e8edf7" }}>
        {value}
      </span>
    </div>
  );

  const hasErrors = errors.length > 0;

  return (
    <div
      className="fixed bottom-4 right-4 rounded-xl z-50"
      style={{
        background: "rgba(8,11,18,0.95)",
        border: `1px solid ${hasErrors ? "rgba(248,113,113,0.5)" : "rgba(79,124,255,0.3)"}`,
        backdropFilter: "blur(8px)",
        maxWidth: 340,
        width: "100%",
        fontSize: 11,
      }}
    >
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 select-none"
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ color: hasErrors ? "#f87171" : "#4f7cff" }}>
            DEBUG
          </span>
          {hasErrors && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(248,113,113,0.2)", color: "#f87171" }}
            >
              {errors.length} error{errors.length !== 1 ? "s" : ""}
            </span>
          )}
          {!open && (
            <span className="text-xs" style={{ color: "#6b7a99" }}>
              {connLabel[connectionState] ?? connectionState} · {agentState}
            </span>
          )}
        </div>
        <span style={{ color: "#6b7a99", fontSize: 14, lineHeight: 1 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {/* Collapsible body */}
      {open && (
        <div
          className="flex flex-col gap-1 px-4 pb-3"
          style={{ borderTop: "1px solid rgba(79,124,255,0.15)" }}
        >
          <div className="pt-2 flex flex-col gap-1">
            {row("connection", connLabel[connectionState] ?? connectionState,
              connectionState === ConnectionState.Connected)}

            {row("mic enabled", String(isMicrophoneEnabled), isMicrophoneEnabled)}

            {row("mic track sid", microphoneTrack?.trackSid ?? "none", !!microphoneTrack)}

            {row("mic track muted",
              microphoneTrack ? String(microphoneTrack.isMuted) : "—",
              microphoneTrack ? !microphoneTrack.isMuted : undefined)}

            {row("local identity", localParticipant?.identity ?? "—")}

            {row(
              "remote participants",
              remoteParticipants.length === 0
                ? "none (agent not joined)"
                : remoteParticipants.map((p) => p.identity).join(", "),
              remoteParticipants.length > 0,
            )}

            {row("agent state", agentState)}

            {row("agent identity", agent?.identity ?? "none (not dispatched)", !!agent)}

            {row("agent audio track", audioTrack ? "present" : "none", !!audioTrack)}

            {row("transcriptions", `${transcriptions.length} segments`)}
          </div>

          {hasErrors && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p style={{ color: "#f87171", fontSize: 10, fontWeight: 600 }}>ERRORS</p>
                <button
                  onClick={() => setErrors([])}
                  style={{ color: "#6b7a99", fontSize: 10, cursor: "pointer" }}
                >
                  clear
                </button>
              </div>
              {errors.map((e, i) => (
                <p key={i} style={{ color: "#f87171", fontSize: 10, wordBreak: "break-all" }}>
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
