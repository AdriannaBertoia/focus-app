"use client";

import { useEffect, useState } from "react";

interface Dump {
  id: string;
  text: string;
  created: string;
}

export default function InboxPage() {
  const [dumps, setDumps] = useState<Dump[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brain-dump")
      .then((r) => r.json())
      .then((data) => { setDumps(data.dumps || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return `Today at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      }
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Inbox</h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        Raw thoughts — process them when you are ready
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : dumps.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
            Inbox empty
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Use the + button to capture a thought
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dumps.map((dump) => (
            <div
              key={dump.id}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-sm mb-2" style={{ color: "var(--text-primary)", lineHeight: "1.6" }}>
                {dump.text}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatTime(dump.created)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
