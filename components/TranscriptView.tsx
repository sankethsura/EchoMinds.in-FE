"use client";

import { useEffect, useRef } from "react";
import type { TextStreamData } from "@livekit/components-core";

interface TranscriptViewProps {
  segments: TextStreamData[];
  localIdentity: string;
}

export function TranscriptView({ segments, localIdentity }: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length]);

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Transcript will appear here…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full px-4 py-3">
      {segments.map((seg, i) => {
        const isUser = seg.participantInfo.identity === localIdentity;
        return (
          <div
            key={`${seg.participantInfo.identity}-${i}`}
            className={`transcript-entry flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}
          >
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: isUser ? "var(--user-color)" : "var(--agent-color)", letterSpacing: "0.12em" }}
            >
              {isUser ? "You" : "Aria"}
            </span>
            <p
              className="text-sm leading-relaxed px-4 py-2 max-w-xs"
              style={{
                background: isUser ? "rgba(5,150,105,0.07)" : "var(--surface-2)",
                color: "var(--text-primary)",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                border: isUser ? "1px solid rgba(5,150,105,0.15)" : "1px solid var(--border-card)",
              }}
            >
              {seg.text}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
