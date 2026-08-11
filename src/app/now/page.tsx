"use client";

import { useEffect, useState, useCallback } from "react";

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
  const [focusMode, setFocusMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60); // 25 min default

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning, Adrianna");
    else if (hour < 17) setGreeting("Good afternoon, Adrianna");
    else setGreeting("Good evening, Adrianna");
    fetchNowData();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds < timerDuration) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timerSeconds, timerDuration]);

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
    setFocusMode(false);
    setTimerRunning(false);
    setTimerSeconds(0);
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
    setFocusMode(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    await fetch("/api/tasks/sweep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    fetchNowData();
  };

  const startFocus = () => {
    setFocusMode(true);
    setTimerRunning(true);
    setTimerSeconds(0);
  };

  const exitFocus = () => {
    setFocusMode(false);
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const progress = timerDuration > 0 ? timerSeconds / timerDuration : 0;
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progress);
  const minutesLeft = Math.max(0, Math.ceil((timerDuration - timerSeconds) / 60));

  // ─── FOCUS MODE: Full-screen, no nav ───
  if (focusMode && currentTask) {
    const energyColor =
      currentTask.energy === "high" ? "var(--energy-high)" :
      currentTask.energy === "medium" ? "var(--energy-medium)" : "var(--energy-low)";

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-8"
        style={{ background: "var(--bg-base)", zIndex: 1000 }}
      >
        {/* Exit button — subtle top-right */}
        <button
          onClick={exitFocus}
          className="absolute top-6 right-6 px-4 py-2 rounded-lg"
          style={{ color: "var(--text-muted)", background: "var(--bg-hover)", minHeight: "40px" }}
        >
          Exit focus
        </button>

        {/* Circular timer */}
        <div className="relative mb-8">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="var(--bg-hover)"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={energyColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          {/* Time in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              {minutesLeft}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              min remaining
            </span>
          </div>
        </div>

        {/* Task title */}
        <div className="text-center mb-10 max-w-md">
          {currentTask.recurring && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinecap="round" className="inline mr-2 -mt-1">
              <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" />
              <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
            </svg>
          )}
          <h1 className="text-xl font-medium" style={{ color: "var(--text-primary)" }}>
            {currentTask.text}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex-1 py-4 rounded-xl font-medium"
            style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)" }}
          >
            {timerRunning ? "Pause" : "Resume"}
          </button>
          <button
            onClick={markDone}
            className="flex-1 py-4 rounded-xl font-medium"
            style={{ background: "var(--status-success)", color: "var(--text-inverse)" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ─── NORMAL MODE ───
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6">
      <p className="text-sm font-medium mb-8" style={{ color: "var(--text-muted)" }}>
        {greeting}
      </p>

      {currentTask ? (
        <div
          className="w-full max-w-md rounded-2xl p-6 mb-6"
          style={{
            background: "var(--bg-surface)",
            borderLeft: `4px solid ${
              currentTask.energy === "high" ? "var(--energy-high)" :
              currentTask.energy === "medium" ? "var(--energy-medium)" : "var(--energy-low)"
            }`,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            Focus on this
          </p>
          <p className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {currentTask.recurring && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinecap="round" className="inline mr-2 -mt-1">
                <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
            )}
            {currentTask.text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={startFocus}
              className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: "var(--accent-light)", color: "var(--accent-hover)" }}
            >
              Start Focus
            </button>
            <button
              onClick={markDone}
              className="flex-1 py-3 rounded-xl font-medium"
              style={{ background: "var(--status-success-light)", color: "var(--status-success)" }}
            >
              Done
            </button>
            <button
              onClick={sweepToTomorrow}
              className="py-3 px-4 rounded-xl font-medium"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              Later
            </button>
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-md rounded-2xl p-8 mb-6 text-center"
          style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            Nothing right now
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Check your tasks when you are ready
          </p>
        </div>
      )}

      {nextMeeting && (
        <div
          className="w-full max-w-md rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--sky-light)", border: "1px solid var(--sky)" }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: "rgba(124, 196, 232, 0.2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E5F8A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{nextMeeting.title}</p>
            <p className="text-xs" style={{ color: "#1E5F8A" }}>
              {nextMeeting.time}
              {nextMeeting.in_minutes !== undefined && (
                <span style={{ color: "var(--status-attention)" }}> — in {nextMeeting.in_minutes} min</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
