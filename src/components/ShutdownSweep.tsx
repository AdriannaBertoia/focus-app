"use client";

import { useEffect, useState } from "react";

interface SweepTask {
  text: string;
  action: "tomorrow" | "inbox" | null;
}

export function ShutdownSweep() {
  const [show, setShow] = useState(false);
  const [tasks, setTasks] = useState<SweepTask[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check every minute if it's shutdown time (4:00 PM)
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      // Show at 4:00 PM, only once per day
      if (hour === 16 && minute === 0) {
        const lastShown = localStorage.getItem("sweep-last-shown");
        const today = now.toISOString().split("T")[0];
        if (lastShown !== today) {
          loadUndoneTasks();
        }
      }
    };

    // Also allow manual trigger via URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get("sweep") === "true") {
      loadUndoneTasks();
    }

    const interval = setInterval(check, 60000);
    check(); // Check immediately
    return () => clearInterval(interval);
  }, []);

  const loadUndoneTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      const undone = (data.tasks || [])
        .filter((t: { done: boolean }) => !t.done)
        .map((t: { text: string }) => ({ text: t.text, action: null }));
      if (undone.length > 0) {
        setTasks(undone);
        setShow(true);
        localStorage.setItem("sweep-last-shown", new Date().toISOString().split("T")[0]);
      }
    } catch {}
  };

  const setAction = (idx: number, action: "tomorrow" | "inbox") => {
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, action } : t))
    );
  };

  const finishSweep = async () => {
    setSaving(true);
    // For now, just close — tasks carry forward automatically via the note generator
    // Items marked "inbox" could go to brain dump
    const inboxItems = tasks.filter((t) => t.action === "inbox");
    for (const item of inboxItems) {
      await fetch("/api/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `[From sweep] ${item.text}`, timestamp: new Date().toISOString() }),
      });
    }
    setSaving(false);
    setShow(false);
  };

  if (!show) return null;

  const allDecided = tasks.every((t) => t.action !== null);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 300, background: "rgba(43, 45, 66, 0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="text-center mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Day&apos;s over! Let&apos;s clean up.
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Swipe each item to tomorrow or back to inbox. No judgment.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {tasks.map((task, i) => {
            const displayText = task.text.replace("[RECURRING] ", "").replace("[RECURRING]", "");
            return (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{
                  background: task.action === "tomorrow" ? "var(--lavender-light)"
                    : task.action === "inbox" ? "var(--peach-light)"
                    : "var(--bg-elevated)",
                  border: task.action ? "1px solid transparent" : "1px solid var(--bg-hover)",
                }}
              >
                <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                  {displayText}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction(i, "tomorrow")}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: task.action === "tomorrow" ? "var(--accent)" : "var(--bg-hover)",
                      color: task.action === "tomorrow" ? "var(--text-inverse)" : "var(--text-secondary)",
                    }}
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => setAction(i, "inbox")}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: task.action === "inbox" ? "var(--peach)" : "var(--bg-hover)",
                      color: task.action === "inbox" ? "var(--text-inverse)" : "var(--text-secondary)",
                    }}
                  >
                    Back to Inbox
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
          >
            Skip
          </button>
          <button
            onClick={finishSweep}
            disabled={!allDecided || saving}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: allDecided ? "var(--status-success)" : "var(--bg-hover)",
              color: allDecided ? "var(--text-inverse)" : "var(--text-muted)",
            }}
          >
            {saving ? "Saving..." : "Done for today"}
          </button>
        </div>
      </div>
    </div>
  );
}
