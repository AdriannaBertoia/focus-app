"use client";

import { useState } from "react";

export function BrainDumpFAB() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), timestamp: new Date().toISOString() }),
      });
      setText("");
      setOpen(false);
    } catch (e) {
      console.error("Failed to save brain dump:", e);
    } finally {
      setSaving(false);
    }
  };

  if (open) {
    return (
      <div
        className="fixed inset-0 flex items-end justify-center p-4"
        style={{ zIndex: 100, background: "rgba(45, 49, 66, 0.3)" }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-5 mb-20"
          style={{
            background: "var(--bg-surface)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
            Brain dump — just get it out of your head
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl p-4 text-base resize-none border-0 focus:ring-0"
            style={{
              background: "var(--bg-base)",
              color: "var(--text-primary)",
              minHeight: "120px",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSave();
            }}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cmd+Enter to save
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: text.trim() ? "var(--accent)" : "var(--bg-hover)",
                  color: text.trim() ? "var(--text-inverse)" : "var(--text-muted)",
                }}
              >
                {saving ? "Saving..." : "Dump it"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed flex items-center justify-center rounded-full"
      style={{
        bottom: "88px",
        right: "20px",
        width: "56px",
        height: "56px",
        background: "linear-gradient(135deg, var(--peach), var(--rose))",
        color: "var(--text-inverse)",
        boxShadow: "0 4px 14px rgba(232, 144, 156, 0.35)",
        zIndex: 60,
      }}
      aria-label="Brain dump"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
