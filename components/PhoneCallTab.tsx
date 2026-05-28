"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { PhoneCallSession } from "./PhoneCallSession";
import { startCall, fetchSipStatus, type TokenResponse } from "@/lib/api";

type CallState =
  | { status: "idle" }
  | { status: "placing"; phoneNumber: string }
  | { status: "active"; session: TokenResponse }
  | { status: "error"; message: string };

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-4 w-full max-w-sm"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <span className="text-xl select-none">📞</span>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="+1 (555) 000-0000"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-lg font-mono"
        style={{ color: "var(--text-primary)" }}
        maxLength={20}
      />
    </div>
  );
}

export function PhoneCallTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sipEnabled, setSipEnabled] = useState<boolean | null>(null);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchSipStatus()
      .then((s) => setSipEnabled(s.enabled))
      .catch(() => setSipEnabled(false));
  }, []);

  const placeCall = useCallback(async () => {
    const number = phoneNumber.trim();
    if (!number) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCallState({ status: "placing", phoneNumber: number });
    try {
      const session = await startCall(number, controller.signal);
      if (!controller.signal.aborted) {
        setCallState({ status: "active", session });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setCallState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to place call",
      });
    }
  }, [phoneNumber]);

  const endCall = useCallback(() => {
    abortRef.current?.abort();
    setCallState({ status: "idle" });
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") placeCall();
  };

  if (callState.status === "active") {
    return (
      <div className="h-full">
        <LiveKitRoom
          serverUrl={callState.session.url}
          token={callState.session.token}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={endCall}
          onError={(err) => setCallState({ status: "error", message: err.message })}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <PhoneCallSession
            phoneNumber={callState.session.phone_number ?? ""}
            onEnd={endCall}
          />
        </LiveKitRoom>
      </div>
    );
  }

  const isPlacing = callState.status === "placing";

  return (
    <div
      className="flex flex-col items-center justify-center gap-10 h-full px-6 relative"
      style={{ background: "var(--bg)" }}
    >
      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AI Phone Call
        </h2>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Enter a phone number and Aria will call it and have a voice conversation on your behalf.
        </p>
      </div>

      {/* SIP not configured banner */}
      {sipEnabled === false && (
        <div
          className="px-5 py-3 rounded-xl text-sm max-w-sm text-center"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            color: "#fbbf24",
          }}
        >
          SIP calling is not configured on the backend.
          Set <code className="font-mono text-xs">LIVEKIT_SIP_TRUNK_ID</code> to enable this feature.
        </div>
      )}

      {/* Phone input */}
      <PhoneInput
        value={phoneNumber}
        onChange={setPhoneNumber}
        disabled={isPlacing || sipEnabled === false}
      />

      {/* Call button */}
      <button
        onClick={placeCall}
        onKeyDown={handleKey}
        disabled={isPlacing || !phoneNumber.trim() || sipEnabled === false}
        className="relative flex items-center justify-center rounded-full font-bold text-base tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          width: 140,
          height: 140,
          background: "radial-gradient(circle at 35% 35%, #34d399, #059669)",
          boxShadow: "0 0 50px 12px rgba(52,211,153,0.3), 0 8px 32px rgba(0,0,0,0.5)",
          color: "#fff",
        }}
      >
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "2px solid rgba(52,211,153,0.5)",
            animation: "orb-breathe 2.5s ease-in-out infinite",
          }}
        />
        {isPlacing ? "Calling…" : "Call"}
      </button>

      {/* Error */}
      {callState.status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-400 text-center max-w-xs">{callState.message}</p>
          <button
            onClick={() => setCallState({ status: "idle" })}
            className="text-xs underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-xs absolute bottom-8" style={{ color: "var(--text-secondary)" }}>
        Calls require a LiveKit SIP trunk to be configured
      </p>
    </div>
  );
}
