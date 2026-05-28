"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { PhoneCallSession } from "./PhoneCallSession";
import { startCall, fetchSipStatus, createOutboundTrunk, createTwilioTrunk, type TokenResponse } from "@/lib/api";

type CallState =
  | { status: "idle" }
  | { status: "placing"; phoneNumber: string }
  | { status: "active"; session: TokenResponse }
  | { status: "error"; message: string };

const isSipUri = (v: string) => v.trim().toLowerCase().startsWith("sip:");

function formatDisplay(raw: string): string {
  if (isSipUri(raw)) return raw;
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
  const isSip = isSipUri(value);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-4 w-full max-w-sm"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <span className="text-xl select-none">{isSip ? "🔗" : "📞"}</span>
      <input
        type="text"
        inputMode={isSip ? "text" : "numeric"}
        placeholder="+91 99999 00000  or  sip:user@sip.linphone.org"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-base font-mono"
        style={{ color: "var(--text-primary)" }}
        maxLength={120}
      />
    </div>
  );
}

type Provider = "linphone" | "twilio" | "plivo";

type SetupState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "done"; trunkId: string; sipDomain?: string }
  | { status: "error"; message: string };

export function PhoneCallTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sipEnabled, setSipEnabled] = useState<boolean | null>(null);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const [setupState, setSetupState] = useState<SetupState>({ status: "idle" });
  const [provider, setProvider] = useState<Provider>("linphone");
  const [twilioCreds, setTwilioCreds] = useState({ accountSid: "", authToken: "", twilioNumber: "" });
  const [plivoCreds, setPlivoCreds] = useState({ address: "voice.plivo.com", username: "", password: "" });
  const [linphoneCreds, setLinphoneCreds] = useState({ username: "", password: "" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchSipStatus()
      .then((s) => setSipEnabled(s.enabled))
      .catch(() => setSipEnabled(false));
  }, []);

  const handleCreateTrunk = useCallback(async () => {
    setSetupState({ status: "creating" });
    try {
      if (provider === "twilio") {
        if (!twilioCreds.accountSid || !twilioCreds.authToken) return;
        const result = await createTwilioTrunk(twilioCreds.accountSid, twilioCreds.authToken, twilioCreds.twilioNumber);
        setSetupState({ status: "done", trunkId: result.trunk_id, sipDomain: result.sip_domain });
      } else if (provider === "linphone") {
        if (!linphoneCreds.username || !linphoneCreds.password) return;
        const result = await createOutboundTrunk(
          "sip.linphone.org",
          linphoneCreds.username,
          linphoneCreds.password,
        );
        setSetupState({ status: "done", trunkId: result.trunk_id });
      } else {
        if (!plivoCreds.username || !plivoCreds.password) return;
        const result = await createOutboundTrunk(plivoCreds.address, plivoCreds.username, plivoCreds.password);
        setSetupState({ status: "done", trunkId: result.trunk_id });
      }
    } catch (err) {
      setSetupState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to create trunk",
      });
    }
  }, [provider, twilioCreds, plivoCreds, linphoneCreds]);

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

      {/* Outbound trunk setup — shown when not yet configured */}
      {sipEnabled === false && (
        <div
          className="flex flex-col gap-4 w-full max-w-sm px-5 py-5 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Set up outbound calling
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Connect a SIP provider to make calls
            </span>
          </div>

          {/* Provider toggle */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {([
              { id: "linphone", label: "Linphone ✓ Free" },
              { id: "twilio",   label: "Twilio" },
              { id: "plivo",    label: "Plivo" },
            ] as { id: Provider; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setProvider(id); setSetupState({ status: "idle" }); }}
                disabled={setupState.status === "creating"}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: provider === id ? "var(--accent)" : "transparent",
                  color: provider === id ? "#fff" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {setupState.status !== "done" ? (
            <>
              {provider === "linphone" && (
                <div className="flex flex-col gap-3">
                  <div
                    className="px-3 py-2.5 rounded-xl text-xs leading-relaxed"
                    style={{ background: "rgba(79,124,255,0.08)", border: "1px solid rgba(79,124,255,0.2)", color: "var(--text-secondary)" }}
                  >
                    <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                      Setup (one-time, completely free)
                    </p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to <span className="font-mono">web.linphone.org</span> → Create account (this is the <strong>bot</strong> caller)</li>
                      <li>On your phone, install <strong>Linphone</strong> app and create a second account (this is where you <strong>receive</strong> the call)</li>
                      <li>Enter the bot account credentials below, click Create Trunk</li>
                      <li>In the Call input above, enter <span className="font-mono">sip:yourphone@sip.linphone.org</span></li>
                    </ol>
                  </div>
                  <input
                    type="text"
                    placeholder="Bot username (e.g. echominds-bot)"
                    value={linphoneCreds.username}
                    onChange={(e) => setLinphoneCreds((c) => ({ ...c, username: e.target.value.trim() }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="password"
                    placeholder="Bot account password"
                    value={linphoneCreds.password}
                    onChange={(e) => setLinphoneCreds((c) => ({ ...c, password: e.target.value.trim() }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {provider === "twilio" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    From <span className="font-mono">console.twilio.com</span> → Account SID, Auth Token, and your Twilio phone number
                  </p>
                  <input
                    type="text"
                    placeholder="Account SID (ACxxxxxxxxxxxxxxxx)"
                    value={twilioCreds.accountSid}
                    onChange={(e) => setTwilioCreds((c) => ({ ...c, accountSid: e.target.value.trim() }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="password"
                    placeholder="Auth Token"
                    value={twilioCreds.authToken}
                    onChange={(e) => setTwilioCreds((c) => ({ ...c, authToken: e.target.value.trim() }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="text"
                    placeholder="Twilio phone number (+13142481094)"
                    value={twilioCreds.twilioNumber}
                    onChange={(e) => setTwilioCreds((c) => ({ ...c, twilioNumber: e.target.value.trim() }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {provider === "plivo" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    From <span className="font-mono">console.plivo.com → Settings</span> → Auth ID and Auth Token
                  </p>
                  <input
                    type="text"
                    placeholder="SIP address (voice.plivo.com)"
                    value={plivoCreds.address}
                    onChange={(e) => setPlivoCreds((c) => ({ ...c, address: e.target.value }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="text"
                    placeholder="Auth ID (username)"
                    value={plivoCreds.username}
                    onChange={(e) => setPlivoCreds((c) => ({ ...c, username: e.target.value }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="password"
                    placeholder="Auth Token (password)"
                    value={plivoCreds.password}
                    onChange={(e) => setPlivoCreds((c) => ({ ...c, password: e.target.value }))}
                    disabled={setupState.status === "creating"}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {setupState.status === "error" && (
                <p className="text-xs text-red-400">{setupState.message}</p>
              )}

              <button
                onClick={handleCreateTrunk}
                disabled={
                  setupState.status === "creating" ||
                  (provider === "linphone" ? !linphoneCreds.username || !linphoneCreds.password
                    : provider === "twilio" ? !twilioCreds.accountSid || !twilioCreds.authToken || !twilioCreds.twilioNumber
                    : !plivoCreds.username || !plivoCreds.password)
                }
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {setupState.status === "creating" ? "Setting up…" : "Create Outbound Trunk"}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="px-3 py-2 rounded-xl"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                <p className="text-xs" style={{ color: "#34d399" }}>
                  Trunk created successfully
                </p>
                {"sipDomain" in setupState && setupState.sipDomain && (
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    SIP domain: {setupState.sipDomain}
                  </p>
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Add to your backend <code className="font-mono">.env</code> and Vercel env vars, then restart:
              </p>
              <code
                className="text-xs px-3 py-2 rounded-lg block break-all"
                style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}
              >
                LIVEKIT_SIP_TRUNK_ID={setupState.trunkId}
              </code>
            </div>
          )}
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
