"use client";

import { ConnectionState } from "livekit-client";

interface ConnectionBadgeProps {
  state: ConnectionState;
}

const CONFIG: Record<ConnectionState, { label: string; color: string; dot: string }> = {
  [ConnectionState.Connected]: {
    label: "Connected",
    color: "rgba(52,211,153,0.15)",
    dot: "#34d399",
  },
  [ConnectionState.Connecting]: {
    label: "Connecting",
    color: "rgba(251,191,36,0.15)",
    dot: "#fbbf24",
  },
  [ConnectionState.Reconnecting]: {
    label: "Reconnecting",
    color: "rgba(251,191,36,0.15)",
    dot: "#fbbf24",
  },
  [ConnectionState.Disconnected]: {
    label: "Disconnected",
    color: "rgba(107,114,153,0.15)",
    dot: "#6b7299",
  },
  [ConnectionState.SignalReconnecting]: {
    label: "Reconnecting",
    color: "rgba(251,191,36,0.15)",
    dot: "#fbbf24",
  },
};

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const cfg = CONFIG[state] ?? CONFIG[ConnectionState.Disconnected];
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: cfg.color, color: "var(--text-primary)" }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
      {cfg.label}
    </div>
  );
}
