"use client";

import { useEffect, useState } from "react";

interface RecordingPromptData {
  pending: boolean;
  meetingTitle?: string;
  app?: string;
  timestamp?: string;
}

export function RecordingPrompt() {
  const [prompt, setPrompt] = useState<RecordingPromptData | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    // Poll every 3 seconds for a recording prompt
    const check = async () => {
      try {
        const res = await fetch("/api/recording");
        const data = await res.json();
        if (data.pending) {
          setPrompt(data);
        } else {
          setPrompt(null);
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const respond = async (action: "record" | "skip") => {
    setResponding(true);
    try {
      await fetch("/api/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setPrompt(null);
    } catch (e) {
      console.error("Failed to respond:", e);
    } finally {
      setResponding(false);
    }
  };

  if (!prompt?.pending) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 p-4"
      style={{ zIndex: 200, background: "rgba(45, 49, 66, 0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="max-w-md mx-auto rounded-2xl p-5"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-lg)",
          border: "2px solid var(--rose)",
        }}
      >
        {/* Pulsing recording indicator */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: "var(--rose)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Meeting Detected
          </p>
        </div>

        <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
          {prompt.meetingTitle ? (
            <>
              <strong>{prompt.meetingTitle}</strong>
              <br />
              Record this meeting?
            </>
          ) : (
            <>Meeting in {prompt.app || "Teams"} — record it?</>
          )}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => respond("skip")}
            disabled={responding}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-secondary)",
            }}
          >
            Skip
          </button>
          <button
            onClick={() => respond("record")}
            disabled={responding}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: "var(--rose)",
              color: "var(--text-inverse)",
            }}
          >
            Record
          </button>
        </div>
      </div>
    </div>
  );
}
