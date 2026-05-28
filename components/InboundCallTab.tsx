"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { InboundMonitorSession } from "./InboundMonitorSession";
import {
  fetchInboundStatus,
  setupInbound,
  fetchActiveCalls,
  monitorCall,
  type InboundStatus,
  type ActiveCall,
  type TokenResponse,
} from "@/lib/api";

type TabState =
  | { status: "idle" }
  | { status: "setting-up" }
  | { status: "monitoring"; session: TokenResponse }
  | { status: "error"; message: string };

export function InboundCallTab() {
  const [inboundStatus, setInboundStatus] = useState<InboundStatus | null>(null);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [tabState, setTabState] = useState<TabState>({ status: "idle" });
  const [setupMsg, setSetupMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load inbound status once on mount
  useEffect(() => {
    fetchInboundStatus()
      .then(setInboundStatus)
      .catch(() => setInboundStatus({ enabled: false, phone_number: "", dispatch_rule_id: null }));
  }, []);

  // Poll active calls every 4 s when inbound is enabled and not monitoring
  useEffect(() => {
    if (!inboundStatus?.enabled || tabState.status === "monitoring") return;

    const poll = () => {
      fetchActiveCalls()
        .then((r) => setActiveCalls(r.calls))
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [inboundStatus?.enabled, tabState.status]);

  const handleSetup = useCallback(async () => {
    setTabState({ status: "setting-up" });
    setSetupMsg(null);
    try {
      const result = await setupInbound();
      setSetupMsg(
        result.created
          ? `Dispatch rule created (${result.dispatch_rule_id})`
          : `Dispatch rule already exists (${result.dispatch_rule_id})`
      );
      // Refresh status to show the new dispatch_rule_id
      const updated = await fetchInboundStatus();
      setInboundStatus(updated);
    } catch (err) {
      setTabState({
        status: "error",
        message: err instanceof Error ? err.message : "Setup failed",
      });
      return;
    }
    setTabState({ status: "idle" });
  }, []);

  const handleMonitor = useCallback(async (roomName: string) => {
    try {
      const session = await monitorCall(roomName);
      setTabState({ status: "monitoring", session });
    } catch (err) {
      setTabState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to join call",
      });
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    setTabState({ status: "idle" });
  }, []);

  // Monitoring view — full screen
  if (tabState.status === "monitoring") {
    return (
      <div className="h-full">
        <LiveKitRoom
          serverUrl={tabState.session.url}
          token={tabState.session.token}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={stopMonitoring}
          onError={(err) => setTabState({ status: "error", message: err.message })}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <InboundMonitorSession roomName={tabState.session.room} onStop={stopMonitoring} />
        </LiveKitRoom>
      </div>
    );
  }

  const isSettingUp = tabState.status === "setting-up";

  return (
    <div
      className="flex flex-col items-center gap-8 h-full px-6 py-10 overflow-y-auto"
      style={{ background: "var(--bg)" }}
    >
      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Inbound Calls
        </h2>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Callers dial your number and Aria answers on your behalf. Monitor live calls below.
        </p>
      </div>

      {/* Not configured */}
      {inboundStatus && !inboundStatus.enabled && (
        <div
          className="px-5 py-3 rounded-xl text-sm max-w-sm text-center"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            color: "#fbbf24",
          }}
        >
          Inbound calling is not configured.{" "}
          Set <code className="font-mono text-xs">LIVEKIT_SIP_INBOUND_TRUNK_ID</code> to enable.
        </div>
      )}

      {inboundStatus?.enabled && (
        <>
          {/* Phone number display */}
          {inboundStatus.phone_number && (
            <div
              className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl w-full max-w-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Call this number
              </span>
              <span className="text-2xl font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                {inboundStatus.phone_number}
              </span>
            </div>
          )}

          {/* Dispatch rule setup */}
          <div
            className="flex flex-col items-center gap-3 w-full max-w-sm px-5 py-4 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Dispatch rule
              </span>
              {inboundStatus.dispatch_rule_id ? (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  Active
                </span>
              ) : (
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
                >
                  Not set up
                </span>
              )}
            </div>
            {inboundStatus.dispatch_rule_id && (
              <p className="text-xs font-mono self-start" style={{ color: "var(--text-secondary)" }}>
                {inboundStatus.dispatch_rule_id}
              </p>
            )}
            <button
              onClick={handleSetup}
              disabled={isSettingUp}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {isSettingUp
                ? "Setting up…"
                : inboundStatus.dispatch_rule_id
                ? "Re-run Setup"
                : "Set Up Dispatch Rule"}
            </button>
            {setupMsg && (
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                {setupMsg}
              </p>
            )}
          </div>

          {/* Active calls */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Active calls
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {activeCalls.length === 0 ? "None" : `${activeCalls.length} live`}
              </span>
            </div>

            {activeCalls.length === 0 ? (
              <div
                className="flex items-center justify-center py-8 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No active calls right now
                </p>
              </div>
            ) : (
              activeCalls.map((call) => (
                <div
                  key={call.room}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className="text-sm font-mono truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {call.room}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {call.num_participants} participant{call.num_participants !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMonitor(call.room)}
                    className="ml-3 shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: "rgba(79,124,255,0.15)",
                      border: "1px solid rgba(79,124,255,0.4)",
                      color: "#5f8cff",
                    }}
                  >
                    Monitor
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Error */}
      {tabState.status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-400 text-center max-w-xs">{tabState.message}</p>
          <button
            onClick={() => setTabState({ status: "idle" })}
            className="text-xs underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
