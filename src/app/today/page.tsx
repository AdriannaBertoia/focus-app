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

export default function TodayPage() {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  if (!data) return <div className="p-8"><p style={{ color: "var(--text-secondary)" }}>No daily note for today.</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">{data.date}</p>
        <h1 style={{ fontFamily: "var(--font-heading), serif" }}>{data.dayOfWeek}</h1>
      </div>

      {/* Intention */}
      {data.intention && data.intention !== "---" && data.intention.trim() && (
        <p className="italic text-base mb-8 pl-4" style={{ color: "var(--text-secondary)", borderLeft: "2px solid var(--accent)" }}>
          {data.intention}
        </p>
      )}

      {/* Priorities — always visible, crossable */}
      <section className="mb-8">
        <p className="section-label mb-3">Priorities</p>
        <PriorityList items={data.priorities} />
      </section>

      {/* Meetings */}
      {data.meetings.length > 0 && (
        <Accordion title="Meetings" count={data.meetings.length} defaultOpen={false}>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--bg-muted)" }}>
            {data.meetings.map((m, i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3"
                style={{ borderBottom: i < data.meetings.length - 1 ? "1px solid var(--bg-muted)" : "none", background: "var(--bg-surface)" }}
              >
                <span className="text-sm w-40 shrink-0" style={{ color: "var(--text-muted)" }}>{m.time}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Schedule */}
      {data.schedule.length > 0 && (
        <Accordion title="Schedule" count={data.schedule.length} defaultOpen={false}>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--bg-muted)" }}>
            {data.schedule.map((s, i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3"
                style={{ borderBottom: i < data.schedule.length - 1 ? "1px solid var(--bg-muted)" : "none", background: "var(--bg-surface)" }}
              >
                <span className="text-sm font-mono w-40 shrink-0" style={{ color: "var(--text-muted)" }}>{s.time}</span>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.block}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {/* Tasks */}
      <Accordion title="Must Do" count={data.mustDo.filter((t) => !t.done).length} defaultOpen={true} color="var(--accent)">
        <TaskList items={data.mustDo} />
      </Accordion>

      {data.shouldDo.length > 0 && (
        <Accordion title="Should Do" count={data.shouldDo.filter((t) => !t.done).length} defaultOpen={false}>
          <TaskList items={data.shouldDo} />
        </Accordion>
      )}

      {/* Out Today */}
      {data.outToday.length > 0 && (
        <Accordion title="Out Today" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {data.outToday.map((p, i) => (
              <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                {p}
              </span>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
}

function PriorityList({ items }: { items: string[] }) {
  const [done, setDone] = useState<boolean[]>(items.map(() => false));

  const toggle = (idx: number) => {
    setDone((prev) => prev.map((d, i) => i === idx ? !d : d));
  };

  return (
    <div className="space-y-2">
      {items.map((p, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="w-full flex items-start gap-3 py-3 px-3 rounded-md text-left"
          style={{
            background: done[i] ? "transparent" : "var(--bg-surface)",
            border: done[i] ? "none" : "1px solid var(--bg-muted)",
            opacity: done[i] ? 0.4 : 1,
          }}
        >
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium mt-0.5 shrink-0"
            style={{
              background: done[i] ? "var(--status-success)" : "var(--bg-muted)",
              color: done[i] ? "white" : "var(--text-secondary)",
            }}
          >
            {done[i] ? "✓" : i + 1}
          </span>
          <p style={{ color: "var(--text-primary)", textDecoration: done[i] ? "line-through" : "none" }}>{p}</p>
        </button>
      ))}
    </div>
  );
}

function TaskList({ items }: { items: { text: string; done: boolean }[] }) {
  const [tasks, setTasks] = useState(items);
  useEffect(() => { setTasks(items); }, [items]);

  if (!tasks.length) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nothing here.</p>;

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
    <div className="space-y-1">
      {tasks.map((item, i) => {
        const isRecurring = item.text.includes("[RECURRING]");
        const displayText = item.text.replace("[RECURRING] ", "").replace("[RECURRING]", "");
        return (
          <div
            key={i}
            className="flex items-center gap-3 py-2 px-3 rounded-md"
            style={{
              opacity: item.done ? 0.4 : 1,
              background: item.done ? "transparent" : "var(--bg-surface)",
            }}
          >
            <button
              onClick={() => toggleTask(i)}
              className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
              style={{
                borderColor: item.done ? "var(--status-success)" : "var(--bg-muted)",
                background: item.done ? "var(--status-success)" : "transparent",
                minHeight: "16px", minWidth: "16px",
              }}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span className="text-sm" style={{ color: "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
              {isRecurring && <span className="text-xs mr-1" style={{ color: "var(--accent)" }}>↻</span>}
              {displayText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
