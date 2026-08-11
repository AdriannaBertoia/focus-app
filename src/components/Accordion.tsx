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
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-2 text-left"
        style={{ minHeight: "36px" }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color || "var(--text-muted)"}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="section-label" style={{ color: color || undefined }}>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {count}
          </span>
        )}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
