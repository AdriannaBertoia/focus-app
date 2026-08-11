"use client";

import { useState } from "react";

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  color?: string;
  children: React.ReactNode;
}

export function Accordion({ title, defaultOpen = false, count, color, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-left"
        style={{ minHeight: "40px" }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color || "var(--text-muted)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: color || "var(--text-muted)" }}
          >
            {title}
          </span>
          {count !== undefined && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              {count}
            </span>
          )}
        </div>
      </button>
      {open && <div className="pl-1">{children}</div>}
    </div>
  );
}
