const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export interface TokenResponse {
  token: string;
  room: string;
  url: string;
  identity: string;
}

export async function fetchToken(signal?: AbortSignal): Promise<TokenResponse> {
  const res = await fetch(`${BACKEND_URL}/token`, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}
