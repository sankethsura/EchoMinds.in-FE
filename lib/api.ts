const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export interface TokenResponse {
  token: string;
  room: string;
  url: string;
  identity: string;
  phone_number?: string;
}

export interface SipStatus {
  enabled: boolean;
}

export interface InboundStatus {
  enabled: boolean;
  phone_number: string;
  dispatch_rule_id: string | null;
}

export interface ActiveCall {
  room: string;
  num_participants: number;
}

export interface SetupInboundResponse {
  dispatch_rule_id: string;
  created: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let detail = text;
    try {
      detail = JSON.parse(text)?.detail ?? text;
    } catch {
      // use raw text
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchToken(signal?: AbortSignal): Promise<TokenResponse> {
  return request<TokenResponse>("/token", { signal });
}

export async function startCall(
  phoneNumber: string,
  signal?: AbortSignal,
): Promise<TokenResponse> {
  return request<TokenResponse>("/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber }),
    signal,
  });
}

export async function fetchSipStatus(): Promise<SipStatus> {
  return request<SipStatus>("/sip-status");
}

export async function createOutboundTrunk(
  address: string,
  username: string,
  password: string,
): Promise<{ trunk_id: string }> {
  return request<{ trunk_id: string }>("/create-outbound-trunk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, username, password }),
  });
}

export async function createTwilioTrunk(
  accountSid: string,
  authToken: string,
  twilioNumber: string,
): Promise<{ trunk_id: string; twilio_trunk_sid: string; sip_domain: string }> {
  return request("/create-twilio-trunk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_sid: accountSid, auth_token: authToken, twilio_number: twilioNumber }),
  });
}

export async function fetchInboundStatus(): Promise<InboundStatus> {
  return request<InboundStatus>("/inbound-status");
}

export async function setupInbound(): Promise<SetupInboundResponse> {
  return request<SetupInboundResponse>("/setup-inbound", { method: "POST" });
}

export async function fetchActiveCalls(): Promise<{ calls: ActiveCall[] }> {
  return request<{ calls: ActiveCall[] }>("/active-calls");
}

export async function monitorCall(roomName: string): Promise<TokenResponse> {
  return request<TokenResponse>(`/monitor-call/${encodeURIComponent(roomName)}`);
}
