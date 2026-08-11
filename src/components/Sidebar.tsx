"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/now", label: "Now", icon: "focus" },
  { href: "/today", label: "Today", icon: "sun" },
  { href: "/week", label: "This Week", icon: "calendar" },
  { href: "/meetings", label: "Meetings", icon: "mic" },
  { href: "/tasks", label: "Tasks", icon: "check" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex flex-col shrink-0 border-r"
      style={{
        width: collapsed ? "60px" : "220px",
        background: "var(--bg-surface)",
        borderColor: "var(--bg-muted)",
        transition: "width 0.2s ease",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        {!collapsed && (
          <h1
            className="text-lg"
            style={{ fontFamily: "var(--font-heading), 'Playfair Display', serif", color: "var(--text-primary)" }}
          >
            Focus
          </h1>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href === "/now" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5"
              style={{
                background: active ? "var(--bg-elevated)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: active ? 500 : 400,
              }}
            >
              <NavIcon icon={item.icon} active={active} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Brain dump quick action */}
      <div className="px-3 pb-4">
        <Link
          href="/inbox?new=true"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!collapsed && <span className="text-sm font-medium">Brain Dump</span>}
        </Link>
      </div>
    </aside>
  );
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? "var(--text-primary)" : "var(--text-muted)";
  const size = 18;

  switch (icon) {
    case "focus":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "sun":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case "calendar":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "mic":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0014 0" /><line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    case "inbox":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      );
    default:
      return null;
  }
}
