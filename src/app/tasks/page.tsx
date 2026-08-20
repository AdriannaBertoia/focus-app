"use client";

import { useEffect, useState, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";

type Energy = "all" | "low" | "medium" | "high";

interface Task {
  id: string;
  text: string;
  energy: Energy;
  done: boolean;
  category: "must" | "should" | "carry";
}

interface RecurringTask {
  id: string;
  text: string;
  category: string;
  energy: string;
  days: string[];
  active: boolean;
}

const energyLabels: Record<Energy, string> = {
  all: "All",
  low: "Low Energy",
  medium: "Medium",
  high: "High Focus",
};

const energyColors: Record<Energy, string> = {
  all: "var(--text-muted)",
  low: "var(--energy-low)",
  medium: "var(--energy-medium)",
  high: "var(--energy-high)",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Energy>("all");
  const [loading, setLoading] = useState(true);
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [newRecurring, setNewRecurring] = useState({ text: "", days: [] as string[], category: "must" });

  const fetchTasks = useCallback(async () => {
    try {
      const r = await fetch("/api/tasks");
      const data = await r.json();
      setTasks(data.tasks || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchRecurring = useCallback(async () => {
    try {
      const r = await fetch("/api/tasks/recurring");
      const data = await r.json();
      setRecurringTasks(data.recurring || []);
    } catch {}
  }, []);

  usePolling(fetchTasks, 30_000);

  useEffect(() => {
    if (showRecurring) fetchRecurring();
  }, [showRecurring, fetchRecurring]);

  const addRecurring = async () => {
    if (!newRecurring.text || newRecurring.days.length === 0) return;
    await fetch("/api/tasks/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecurring),
    });
    setNewRecurring({ text: "", days: [], category: "must" });
    fetchRecurring();
  };

  const deleteRecurring = async (id: string) => {
    await fetch("/api/tasks/recurring", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchRecurring();
  };

  const toggleDay = (day: string) => {
    setNewRecurring((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.energy === filter);
  const incomplete = filtered.filter((t) => !t.done);
  const done = filtered.filter((t) => t.done);

  const sweepAll = async () => {
    // Move all incomplete to tomorrow — zero shame
    const incompleteIds = incomplete.map((t) => t.id);
    await fetch("/api/tasks/sweep-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: incompleteIds }),
    });
    setTasks((prev) => prev.filter((t) => t.done));
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {incomplete.length} remaining
          </p>
        </div>
        {incomplete.length > 0 && (
          <button
            onClick={sweepAll}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
          >
            Sweep to tomorrow
          </button>
        )}
      </div>

      {/* Energy filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {(["all", "low", "medium", "high"] as Energy[]).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
            style={{
              background: filter === level ? "var(--bg-surface)" : "transparent",
              color: filter === level ? energyColors[level] : "var(--text-muted)",
              border: filter === level ? `1.5px solid ${energyColors[level]}` : "1.5px solid transparent",
              boxShadow: filter === level ? "var(--shadow-sm)" : "none",
            }}
          >
            {energyLabels[level]}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : incomplete.length === 0 && done.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>All clear</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Nothing on your plate right now</p>
        </div>
      ) : (
        <>
          {/* Incomplete */}
          <div className="space-y-2 mb-6">
            {incomplete.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => {
                setTasks((prev) =>
                  prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                );
              }} />
            ))}
          </div>

          {/* Done — collapsible */}
          {done.length > 0 && (
            <details>
              <summary
                className="text-xs font-medium uppercase tracking-wide cursor-pointer mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Done today ({done.length})
              </summary>
              <div className="space-y-2">
                {done.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={() => {
                    setTasks((prev) =>
                      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                    );
                  }} />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* Recurring Tasks Section */}
      <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--bg-muted)" }}>
        <button
          onClick={() => setShowRecurring(!showRecurring)}
          className="flex items-center gap-2 text-sm font-medium mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          <span style={{ transform: showRecurring ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
          Recurring Tasks
        </button>

        {showRecurring && (
          <div>
            {/* Add new recurring task */}
            <div className="rounded-lg p-4 mb-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-muted)" }}>
              <input
                type="text"
                placeholder="Task name..."
                value={newRecurring.text}
                onChange={(e) => setNewRecurring((prev) => ({ ...prev, text: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-md mb-3"
                style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--bg-muted)" }}
              />
              <div className="flex flex-wrap gap-1.5 mb-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: newRecurring.days.includes(day) ? "var(--accent)" : "var(--bg-elevated)",
                      color: newRecurring.days.includes(day) ? "white" : "var(--text-muted)",
                    }}
                  >
                    {day.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newRecurring.category}
                  onChange={(e) => setNewRecurring((prev) => ({ ...prev, category: e.target.value }))}
                  className="text-xs px-2 py-1.5 rounded-md"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-muted)" }}
                >
                  <option value="must">Must-do</option>
                  <option value="should">Should-do</option>
                </select>
                <button
                  onClick={addRecurring}
                  className="px-4 py-1.5 rounded-md text-xs font-medium ml-auto"
                  style={{ background: "var(--warm-black)", color: "var(--text-inverse)" }}
                >
                  Add Recurring
                </button>
              </div>
            </div>

            {/* List existing recurring tasks */}
            <div className="space-y-2">
              {recurringTasks.map((rt) => (
                <div
                  key={rt.id}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <span className="text-xs" style={{ color: "var(--accent)" }}>↻</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{rt.text}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {rt.days.map((d) => d.slice(0, 3).toUpperCase()).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRecurring(rt.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {recurringTasks.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No recurring tasks yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        background: "var(--bg-surface)",
        opacity: task.done ? 0.5 : 1,
      }}
    >
      <button
        onClick={onToggle}
        className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: task.done ? "var(--status-success)" : energyColors[task.energy],
          background: task.done ? "var(--status-success-light)" : "transparent",
          minHeight: "24px",
          minWidth: "24px",
        }}
      >
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span
        className="text-sm flex-1"
        style={{
          color: "var(--text-primary)",
          textDecoration: task.done ? "line-through" : "none",
        }}
      >
        {task.text}
      </span>
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: energyColors[task.energy] }}
      />
    </div>
  );
}
