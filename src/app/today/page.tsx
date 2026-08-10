"use client";

import { useEffect, useState } from "react";

interface DayData {
  date: string;
  dayOfWeek: string;
  priorities: string[];
  intention: string;
  meetings: { time: string; title: string; notes: string }[];
  schedule: { time: string; block: string }[];
  mustDo: { text: string; done: boolean }[];
  shouldDo: { text: string; done: boolean }[];
  carryForward: { text: string; done: boolean }[];
  outToday: string[];
}

export default function TodayPage() {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <p style={{ color: "var(--text-muted)" }}>Loading today...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-5 pt-6">
        <p style={{ color: "var(--text-secondary)" }}>No daily note found for today.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Header */}
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {data.dayOfWeek}
      </h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{data.date}</p>

      {/* Intention */}
      {data.intention && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "var(--accent-light)", border: "1px solid rgba(127, 154, 144, 0.15)" }}
        >
          <p className="text-sm italic" style={{ color: "var(--accent-hover)" }}>
            {data.intention}
          </p>
        </div>
      )}

      {/* Top 3 Priorities — progressive disclosure, show only these */}
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
          Top 3 Priorities
        </p>
        <div className="space-y-2">
          {data.priorities.map((p, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex items-center gap-3"
              style={{ background: "var(--bg-surface)" }}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule — visual timeline */}
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
          Schedule
        </p>
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)" }}>
          {data.schedule.map((s, i) => (
            <div
              key={i}
              className="flex items-center px-4 py-3"
              style={{ borderBottom: i < data.schedule.length - 1 ? "1px solid var(--bg-hover)" : "none" }}
            >
              <span className="text-xs font-mono w-32 shrink-0" style={{ color: "var(--text-muted)" }}>
                {s.time}
              </span>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {s.block}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Meetings */}
      {data.meetings.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            Meetings
          </p>
          <div className="space-y-2">
            {data.meetings.map((m, i) => (
              <div
                key={i}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ background: "var(--status-info-light)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--status-info)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks — Must Do */}
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
          Must Do
        </p>
        <TaskList items={data.mustDo} />
      </div>

      {/* Team Context */}
      {data.outToday.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            Out Today
          </p>
          <div className="flex flex-wrap gap-2">
            {data.outToday.map((person, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
              >
                {person}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskList({ items }: { items: { text: string; done: boolean }[] }) {
  if (!items.length) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nothing here</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-3 flex items-center gap-3"
          style={{
            background: "var(--bg-surface)",
            opacity: item.done ? 0.5 : 1,
          }}
        >
          <div
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
            style={{
              borderColor: item.done ? "var(--status-success)" : "var(--text-muted)",
              background: item.done ? "var(--status-success-light)" : "transparent",
            }}
          >
            {item.done && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span
            className="text-sm"
            style={{
              color: "var(--text-primary)",
              textDecoration: item.done ? "line-through" : "none",
            }}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}
