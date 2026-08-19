"use client";

import { useEffect, useState, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";

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
  const [focusMode, setFocusMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerDuration = 25 * 60;

  const fetchNowData = useCallback(async () => {
    try {
      const res = await fetch("/api/now");
      if (res.ok) {
        const data = await res.json();
        setCurrentTask(data.currentTask);
        setNextMeeting(data.nextMeeting);
      }
    } catch {}
  }, []);

  // Poll every 30 seconds + re-fetch when tab becomes visible
  usePolling(fetchNowData, 30_000);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds < timerDuration) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timerSeconds, timerDuration]);

  const markDone = async () => {
    if (!currentTask) return;
    const id = currentTask.id;
    setCurrentTask(null);
    setFocusMode(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNowData();
  };

  const sweep = async () => {
    if (!currentTask) return;
    const id = currentTask.id;
    setCurrentTask(null);
    setFocusMode(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    await fetch("/api/tasks/sweep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNowData();
  };

  const progress = timerDuration > 0 ? timerSeconds / timerDuration : 0;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - progress);
  const minutesLeft = Math.max(0, Math.ceil((timerDuration - timerSeconds) / 60));

  // ── Focus Mode ──
  if (focusMode && currentTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-8" style={{ background: "var(--bg-base)" }}>
        <button
          onClick={() => { setFocusMode(false); setTimerRunning(false); setTimerSeconds(0); }}
          className="absolute top-6 right-8 text-sm px-4 py-2 rounded-md"
          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
        >
          Exit
        </button>

        <div className="relative mb-10">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-muted)" strokeWidth="3" />
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              transform="rotate(-90 80 80)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light" style={{ fontFamily: "var(--font-heading), serif" }}>{minutesLeft}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>minutes</span>
          </div>
        </div>

        <h2 className="text-center text-xl mb-8 max-w-md" style={{ color: "var(--text-primary)" }}>
          {currentTask.text}
        </h2>

        <div className="flex gap-4">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="px-8 py-3 rounded-md text-sm font-medium"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            {timerRunning ? "Pause" : "Resume"}
          </button>
          <button
            onClick={markDone}
            className="px-8 py-3 rounded-md text-sm font-medium"
            style={{ background: "var(--warm-black)", color: "var(--text-inverse)" }}
          >
            Complete
          </button>
        </div>
      </div>
    );
  }

  // ── Normal View ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{greeting}, Adrianna</p>
      <h1 className="mb-10" style={{ fontFamily: "var(--font-heading), serif" }}>What to focus on</h1>

      {currentTask ? (
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-muted)",
          }}
        >
          {currentTask.recurring && (
            <span className="section-label" style={{ color: "var(--accent)" }}>Recurring</span>
          )}
          <p className="text-lg font-medium mt-1 mb-5" style={{ color: "var(--text-primary)" }}>
            {currentTask.text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setFocusMode(true); setTimerRunning(true); setTimerSeconds(0); }}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{ background: "var(--warm-black)", color: "var(--text-inverse)" }}
            >
              Start Focus
            </button>
            <button
              onClick={markDone}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{ background: "var(--sage-light)", color: "var(--sage)" }}
            >
              Done
            </button>
            <button
              onClick={sweep}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              Later
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-8 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}>
          <p style={{ color: "var(--text-secondary)" }}>Nothing right now.</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Check your tasks when you are ready.</p>
        </div>
      )}

      {nextMeeting && (
        <div className="rounded-lg p-4 mt-4 flex items-center gap-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--rose)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{nextMeeting.title}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {nextMeeting.time}
              {nextMeeting.in_minutes !== undefined && ` — in ${nextMeeting.in_minutes} min`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
