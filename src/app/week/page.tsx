"use client";

import { useEffect, useState } from "react";

interface DayColumn {
  date: string;
  dayName: string;
  shortDate: string;
  isToday: boolean;
  meetings: { time: string; title: string }[];
  tasks: { id: string; text: string; done: boolean }[];
}

export default function WeekPage() {
  const [days, setDays] = useState<DayColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<{ dayIdx: number; taskIdx: number } | null>(null);

  useEffect(() => {
    fetch("/api/week")
      .then((r) => r.json())
      .then((data) => { setDays(data.days || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDragStart = (dayIdx: number, taskIdx: number) => {
    setDragItem({ dayIdx, taskIdx });
  };

  const handleDrop = (targetDayIdx: number) => {
    if (!dragItem || dragItem.dayIdx === targetDayIdx) {
      setDragItem(null);
      return;
    }

    setDays((prev) => {
      const updated = [...prev];
      const task = updated[dragItem.dayIdx].tasks[dragItem.taskIdx];
      // Remove from source
      updated[dragItem.dayIdx] = {
        ...updated[dragItem.dayIdx],
        tasks: updated[dragItem.dayIdx].tasks.filter((_, i) => i !== dragItem.taskIdx),
      };
      // Add to target
      updated[targetDayIdx] = {
        ...updated[targetDayIdx],
        tasks: [...updated[targetDayIdx].tasks, task],
      };
      return updated;
    });
    setDragItem(null);

    // TODO: persist the move via API
  };

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <p style={{ color: "var(--text-muted)" }}>Loading week...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        This Week
      </h1>

      {/* Horizontal scroll week view */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
        {days.map((day, dayIdx) => (
          <div
            key={day.date}
            className="snap-start shrink-0 rounded-xl p-4 flex flex-col"
            style={{
              width: "260px",
              minHeight: "400px",
              background: day.isToday ? "#F9F5FF" : "var(--bg-surface)",
              border: day.isToday
                ? "2px solid var(--accent)"
                : "1px solid var(--bg-hover)",
              boxShadow: "var(--shadow-sm)",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(dayIdx)}
          >
            {/* Day header */}
            <div className="mb-3">
              <p
                className="text-sm font-semibold"
                style={{ color: day.isToday ? "#5B21B6" : "var(--text-primary)" }}
              >
                {day.dayName}
              </p>
              <p className="text-xs" style={{ color: day.isToday ? "#6D28D9" : "var(--text-secondary)" }}>
                {day.shortDate}
              </p>
            </div>

            {/* Meetings */}
            {day.meetings.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#1E5F8A" }}>
                  Meetings
                </p>
                <div className="space-y-1">
                {day.meetings.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{ background: "var(--sky-light)", border: "1px solid var(--sky)" }}
                  >
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {m.title}
                    </span>
                    <br />
                    <span style={{ color: "#1E5F8A" }}>{m.time}</span>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Divider between meetings and tasks */}
            {day.meetings.length > 0 && day.tasks.filter((t) => !t.done).length > 0 && (
              <div className="border-t mb-3" style={{ borderColor: "var(--bg-hover)" }} />
            )}

            {/* Action Items header */}
            {day.tasks.filter((t) => !t.done).length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
                Action Items
              </p>
            )}

            {/* Tasks — draggable with checkmarks */}
            <div className="flex-1 space-y-2">
              {day.tasks.filter((t) => !t.done).map((task, taskIdx) => {
                const isRecurring = task.text.includes("[RECURRING]");
                const displayText = task.text.replace("[RECURRING] ", "").replace("[RECURRING]", "");
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(dayIdx, taskIdx)}
                    className="rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing flex items-center gap-2"
                    style={{
                      background: "var(--bg-hover)",
                      color: "var(--text-primary)",
                      opacity: dragItem?.dayIdx === dayIdx && dragItem?.taskIdx === taskIdx ? 0.4 : 1,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mark done locally
                        setDays((prev) => {
                          const updated = [...prev];
                          updated[dayIdx] = {
                            ...updated[dayIdx],
                            tasks: updated[dayIdx].tasks.map((t, i) =>
                              i === taskIdx ? { ...t, done: true } : t
                            ),
                          };
                          return updated;
                        });
                        // Persist
                        fetch("/api/tasks/complete", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: task.text }),
                        });
                      }}
                      className="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: "var(--text-muted)", minHeight: "20px", minWidth: "20px" }}
                    />
                    {isRecurring && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                        <path d="M17 2l4 4-4 4" />
                        <path d="M3 11v-1a4 4 0 014-4h14" />
                        <path d="M7 22l-4-4 4-4" />
                        <path d="M21 13v1a4 4 0 01-4 4H3" />
                      </svg>
                    )}
                    <span className="flex-1">{displayText}</span>
                  </div>
                );
              })}
              {day.tasks.filter((t) => !t.done).length === 0 && day.meetings.length === 0 && (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  Nothing planned
                </p>
              )}
            </div>

            {/* Done count */}
            {day.tasks.filter((t) => t.done).length > 0 && (
              <p className="text-xs mt-2 pt-2" style={{ color: "var(--status-success)", borderTop: "1px solid var(--bg-hover)" }}>
                {day.tasks.filter((t) => t.done).length} done
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
