# EchoMinds — Frontend

Next.js voice UI that connects to the backend and renders a real-time voice conversation with Aria.

## Prerequisites

- Node.js 20+
- The backend running on port 8000

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different port/host
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | URL of the FastAPI backend | `http://localhost:8000` |

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the **Talk** button
2. Allow microphone access when prompted
3. The agent (Aria) will greet you and begin listening
4. Speak naturally — Aria responds with voice
5. A live transcript scrolls at the bottom
6. Click **End Call** to disconnect

## How it works

- Clicking Talk fetches a short-lived LiveKit JWT from the backend `/token` endpoint
- The frontend joins the LiveKit room using that token
- LiveKit dispatches a job to the agent worker, which joins the same room
- The agent handles STT → LLM → TTS in a streaming pipeline
- `@livekit/components-react` hooks handle audio rendering and state
# EchoMinds.in-FE
