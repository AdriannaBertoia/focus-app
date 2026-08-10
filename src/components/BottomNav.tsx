"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/now", label: "Now", icon: "focus", color: "#7C3AED" },
  { href: "/today", label: "Today", icon: "calendar", color: "#2563EB" },
  { href: "/week", label: "Week", icon: "week", color: "#B45309" },
  { href: "/meetings", label: "Meetings", icon: "mic", color: "#BE185D" },
  { href: "/tasks", label: "Tasks", icon: "check", color: "#15803D" },
];

function NavIcon({ icon, active, color }: { icon: string; active: boolean; color: string }) {
  const stroke = active ? color : "var(--text-muted)";

  switch (icon) {
    case "focus":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "mic":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case "check":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    case "inbox":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      );
    case "week":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="10" x2="8" y2="20" />
          <line x1="12" y1="10" x2="12" y2="20" />
          <line x1="16" y1="10" x2="16" y2="20" />
        </svg>
      );
    default:
  }
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 py-2"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--bg-hover)",
        boxShadow: "0 -2px 8px rgba(45, 49, 66, 0.04)",
        height: "72px",
        zIndex: 50,
      }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href === "/now" && pathname === "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-h-[56px] min-w-[56px]"
            style={{
              background: active ? `${item.color}15` : "transparent",
            }}
          >
            <NavIcon icon={item.icon} active={active} color={item.color} />
            <span
              className="text-xs font-medium"
              style={{ color: active ? item.color : "var(--text-muted)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
