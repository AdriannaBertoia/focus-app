"use client";

import { useEffect, useState } from "react";

interface Task {
  id: string;
  text: string;
  energy: "low" | "medium" | "high";
  done: boolean;
  recurring?: boolean;
}

interface Meeting {
  time: string;
  title: string;
  in_minutes?: number;
}

export default function NowPage() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning, Adrianna");
    else if (hour < 17) setGreeting("Good afternoon, Adrianna");
    else setGreeting("Good evening, Adrianna");

    // Fetch current focus task and next meeting
    fetchNowData();
  }, []);

  const fetchNowData = async () => {
    try {
      const res = await fetch("/api/now");
      if (res.ok) {
        const data = await res.json();
        setCurrentTask(data.currentTask);
        setNextMeeting(data.nextMeeting);
      }
    } catch (e) {
      console.error("Failed to fetch now data:", e);
    }
  };

  const markDone = async () => {
    if (!currentTask) return;
    const taskId = currentTask.id;
    setCurrentTask(null);
    await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    fetchNowData();
  };

  const sweepToTomorrow = async () => {
    if (!currentTask) return;
    const taskId = currentTask.id;
    setCurrentTask(null);
    await fetch("/api/tasks/sweep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    fetchNowData();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6">
      {/* Greeting */}
      <p
        className="text-sm font-medium mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        {greeting}
      </p>

      {/* Current Focus Task — ONE task only */}
      {currentTask ? (
        <div
          className="w-full max-w-md rounded-2xl p-6 mb-6"
          style={{
            background: "var(--lavender-light)",
            border: "1px solid rgba(167, 139, 250, 0.2)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Focus on this
          </p>
          <p className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {currentTask.recurring && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2" strokeLinecap="round" className="inline mr-2 -mt-1">
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
            )}
            {currentTask.text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={markDone}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{
                background: "var(--status-success-light)",
                color: "var(--status-success)",
              }}
            >
              Done
            </button>
            <button
              onClick={sweepToTomorrow}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{
                background: "var(--bg-hover)",
                color: "var(--text-secondary)",
              }}
            >
              Tomorrow
            </button>
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-md rounded-2xl p-8 mb-6 text-center"
          style={{
            background: "var(--bg-surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            Nothing right now
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Check your tasks when you are ready
          </p>
        </div>
      )}

      {/* Next Meeting */}
      {nextMeeting && (
        <div
          className="w-full max-w-md rounded-xl p-4 flex items-center gap-4"
          style={{
            background: "var(--sky-light)",
            border: "1px solid rgba(124, 196, 232, 0.25)",
          }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: "rgba(143, 164, 184, 0.2)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {nextMeeting.title}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {nextMeeting.time}
              {nextMeeting.in_minutes !== undefined && (
                <span style={{ color: "var(--status-attention)" }}>
                  {" "}— in {nextMeeting.in_minutes} min
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
