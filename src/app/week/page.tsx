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
      const incompleteTasks = updated[dragItem.dayIdx].tasks.filter((t) => !t.done);
      const task = incompleteTasks[dragItem.taskIdx];
      updated[dragItem.dayIdx] = {
        ...updated[dragItem.dayIdx],
        tasks: updated[dragItem.dayIdx].tasks.filter((t) => t.id !== task.id),
      };
      updated[targetDayIdx] = {
        ...updated[targetDayIdx],
        tasks: [...updated[targetDayIdx].tasks, task],
      };
      return updated;
    });
    setDragItem(null);
  };

  const completeTask = (dayIdx: number, taskId: string, taskText: string) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = {
        ...updated[dayIdx],
        tasks: updated[dayIdx].tasks.map((t) =>
          t.id === taskId ? { ...t, done: true } : t
        ),
      };
      return updated;
    });
    fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskText }),
    });
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

      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
        {days.map((day, dayIdx) => {
          const incompleteTasks = day.tasks.filter((t) => !t.done);
          const visibleTasks = incompleteTasks.slice(0, 3);
          const hiddenCount = incompleteTasks.length - 3;
          const doneCount = day.tasks.filter((t) => t.done).length;

          return (
            <div
              key={day.date}
              className="snap-start shrink-0 rounded-xl p-4 flex flex-col"
              style={{
                width: "260px",
                minHeight: "400px",
                background: day.isToday ? "#F9F5FF" : "var(--bg-surface)",
                border: day.isToday ? "2px solid var(--accent)" : "1px solid var(--bg-hover)",
                boxShadow: "var(--shadow-sm)",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(dayIdx)}
            >
              {/* Day header */}
              <div className="mb-3">
                <p className="font-semibold" style={{ color: day.isToday ? "#5B21B6" : "var(--text-primary)" }}>
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
                        className="rounded-lg px-3 py-2"
                        style={{ background: "var(--sky-light)", border: "1px solid var(--sky)" }}
                      >
                        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                          {m.title}
                        </span>
                        <br />
                        <span className="text-xs" style={{ color: "#1E5F8A" }}>{m.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {day.meetings.length > 0 && incompleteTasks.length > 0 && (
                <div className="border-t mb-3" style={{ borderColor: "var(--bg-hover)" }} />
              )}

              {/* Action Items — top 3 only */}
              {incompleteTasks.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
                    Action Items
                  </p>
                  <div className="space-y-2">
                    {visibleTasks.map((task, taskIdx) => {
                      const isRecurring = task.text.includes("[RECURRING]");
                      const displayText = task.text.replace("[RECURRING] ", "").replace("[RECURRING]", "");
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(dayIdx, taskIdx)}
                          className="rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing flex items-center gap-2"
                          style={{
                            background: "var(--bg-surface)",
                            borderLeft: `3px solid ${isRecurring ? "var(--peach)" : "var(--energy-medium)"}`,
                            boxShadow: "var(--shadow-sm)",
                            opacity: dragItem?.dayIdx === dayIdx && dragItem?.taskIdx === taskIdx ? 0.4 : 1,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completeTask(dayIdx, task.id, task.text);
                            }}
                            className="w-4 h-4 rounded border-2 shrink-0"
                            style={{ borderColor: "var(--text-muted)", minHeight: "16px", minWidth: "16px" }}
                          />
                          {isRecurring && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                              <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" />
                              <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
                            </svg>
                          )}
                          <span className="flex-1 text-sm">{displayText}</span>
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <button
                        className="w-full text-center py-2 rounded-lg text-xs font-medium"
                        style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                      >
                        + {hiddenCount} more
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {incompleteTasks.length === 0 && day.meetings.length === 0 && (
                <p className="text-xs py-4 text-center flex-1" style={{ color: "var(--text-muted)" }}>
                  Nothing planned
                </p>
              )}

              {/* Done count */}
              {doneCount > 0 && (
                <p className="text-xs mt-3 pt-2" style={{ color: "var(--status-success)", borderTop: "1px solid var(--bg-hover)" }}>
                  {doneCount} completed
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
