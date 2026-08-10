"use client";

import { useEffect, useState } from "react";

type Energy = "all" | "low" | "medium" | "high";

interface Task {
  id: string;
  text: string;
  energy: Energy;
  done: boolean;
  category: "must" | "should" | "carry";
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

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { setTasks(data.tasks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
