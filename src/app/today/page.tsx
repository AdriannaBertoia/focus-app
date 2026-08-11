"use client";

import { useEffect, useState } from "react";
import { Accordion } from "@/components/Accordion";

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

interface MeetingPrep {
  title: string;
  time: string;
  description: string;
  links: string[];
  prework: string[];
}

export default function TodayPage() {
  const [data, setData] = useState<DayData | null>(null);
  const [prep, setPrep] = useState<MeetingPrep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/today").then((r) => r.json()),
      fetch("/api/calendar/prep").then((r) => r.json()),
    ])
      .then(([dayData, prepData]) => {
        setData(dayData);
        setPrep(prepData.meetings || []);
        setLoading(false);
      })
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

  const prepWithContent = prep.filter((p) => p.links.length > 0 || p.prework.length > 0);

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Header */}
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {data.dayOfWeek}
      </h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{data.date}</p>

      {/* Intention */}
      {data.intention && data.intention !== "---" && data.intention.trim() !== "" && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: "var(--lavender-light)", border: "1px solid rgba(167, 139, 250, 0.15)" }}
        >
          <p className="italic" style={{ color: "var(--accent-hover)" }}>
            {data.intention}
          </p>
        </div>
      )}

      {/* Top 3 Priorities — ALWAYS expanded */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--accent-hover)" }}>
          Top 3 Priorities
        </p>
        <div className="space-y-2">
          {data.priorities.map((p, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex items-center gap-3"
              style={{
                background: "var(--bg-surface)",
                borderLeft: `4px solid ${i === 0 ? "var(--energy-high)" : i === 1 ? "var(--energy-medium)" : "var(--energy-low)"}`,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                style={{
                  background: i === 0 ? "var(--energy-high-light)" : i === 1 ? "var(--energy-medium-light)" : "var(--energy-low-light)",
                  color: i === 0 ? "var(--energy-high)" : i === 1 ? "#9A7B20" : "var(--energy-low)",
                }}
              >
                {i + 1}
              </span>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Everything else is collapsible */}

      {/* Meetings — collapsed by default */}
      {data.meetings.length > 0 && (
        <Accordion title="Meetings" count={data.meetings.length} color="#1E5F8A" defaultOpen={false}>
          <div className="space-y-2">
            {data.meetings.map((m, i) => (
              <div
                key={i}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--sky)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E5F8A" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</p>
                  <p className="text-xs" style={{ color: "#1E5F8A" }}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Schedule — collapsed */}
      {data.schedule.length > 0 && (
        <Accordion title="Schedule" count={data.schedule.length} defaultOpen={false}>
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
            {data.schedule.map((s, i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3"
                style={{ borderBottom: i < data.schedule.length - 1 ? "1px solid var(--bg-hover)" : "none" }}
              >
                <span className="text-xs font-mono w-36 shrink-0" style={{ color: "var(--text-muted)" }}>
                  {s.time}
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  {s.block}
                </span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Meeting Prep — collapsed (show if has content) */}
      {prepWithContent.length > 0 && (
        <Accordion title="Meeting Prep" count={prepWithContent.length} color="var(--peach)" defaultOpen={false}>
          <div className="space-y-2">
            {prepWithContent.map((p, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: "var(--peach-light)", border: "1px solid var(--peach)" }}
              >
                <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  {p.title}
                  {p.time && <span style={{ color: "var(--text-secondary)" }}> — {p.time}</span>}
                </p>
                {p.prework.map((pw, j) => (
                  <p key={j} style={{ color: "var(--text-secondary)" }}>{pw}</p>
                ))}
                {p.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.links.map((link, j) => (
                      <a
                        key={j}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-light)",
                          minHeight: "32px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Link
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Must Do — collapsed */}
      <Accordion title="Must Do" count={data.mustDo.filter((t) => !t.done).length} color="var(--energy-high)" defaultOpen={false}>
        <TaskList items={data.mustDo} />
      </Accordion>

      {/* Should Do — collapsed */}
      {data.shouldDo.length > 0 && (
        <Accordion title="Should Do" count={data.shouldDo.filter((t) => !t.done).length} color="var(--energy-medium)" defaultOpen={false}>
          <TaskList items={data.shouldDo} />
        </Accordion>
      )}

      {/* Team Context */}
      {data.outToday.length > 0 && (
        <Accordion title="Out Today" count={data.outToday.length} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {data.outToday.map((person, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full"
                style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--bg-hover)" }}
              >
                {person}
              </span>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
}

function TaskList({ items }: { items: { text: string; done: boolean }[] }) {
  const [tasks, setTasks] = useState(items);

  useEffect(() => { setTasks(items); }, [items]);

  if (!tasks.length) {
    return <p style={{ color: "var(--text-muted)" }}>Nothing here</p>;
  }

  const toggleTask = async (idx: number) => {
    const task = tasks[idx];
    if (task.done) return;
    setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, done: true } : t));
    await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.text }),
    });
  };

  return (
    <div className="space-y-2">
      {tasks.map((item, i) => {
        const isRecurring = item.text.includes("[RECURRING]");
        const displayText = item.text.replace("[RECURRING] ", "").replace("[RECURRING]", "");
        return (
          <div
            key={i}
            className="rounded-lg p-3 flex items-center gap-3"
            style={{
              background: "var(--bg-surface)",
              opacity: item.done ? 0.5 : 1,
              borderLeft: item.done ? "none" : "4px solid var(--energy-medium)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <button
              onClick={() => toggleTask(i)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: item.done ? "var(--status-success)" : "var(--text-muted)",
                background: item.done ? "var(--status-success-light)" : "transparent",
                minHeight: "20px",
                minWidth: "20px",
              }}
            >
              {item.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            {isRecurring && !item.done && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
            )}
            <span style={{ color: "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
              {displayText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
