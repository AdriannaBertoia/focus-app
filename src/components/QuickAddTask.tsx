"use client";

import { useState } from "react";

export function QuickAddTask() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<"must" | "should">("must");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    await fetch("/api/tasks/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), date: today, category }),
    });

    setText("");
    setSaving(false);
    setOpen(false);
  };

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
        style={{ background: "var(--warm-black)", color: "var(--text-inverse)" }}
        aria-label="Add task"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div
            className="relative w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl p-6 mb-0 sm:mb-0"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Quick Add Task
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="What do you need to do?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full text-sm px-4 py-3 rounded-lg mb-3"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--bg-muted)",
                }}
              />

              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setCategory("must")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: category === "must" ? "var(--accent)" : "var(--bg-elevated)",
                    color: category === "must" ? "white" : "var(--text-muted)",
                  }}
                >
                  Must-do
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("should")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: category === "should" ? "var(--accent)" : "var(--bg-elevated)",
                    color: category === "should" ? "white" : "var(--text-muted)",
                  }}
                >
                  Should-do
                </button>
              </div>

              <button
                type="submit"
                disabled={!text.trim() || saving}
                className="w-full py-3 rounded-lg text-sm font-medium"
                style={{
                  background: text.trim() ? "var(--warm-black)" : "var(--bg-elevated)",
                  color: text.trim() ? "var(--text-inverse)" : "var(--text-muted)",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
