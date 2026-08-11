"use client";

import { useState, useRef, useEffect } from "react";

interface EditableTextProps {
  text: string;
  date?: string;
  onSave?: (newText: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function EditableText({ text, date, onSave, className, style }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(text); }, [text]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = async () => {
    setEditing(false);
    const newText = value.trim();
    if (!newText || newText === text) {
      setValue(text);
      return;
    }

    // Persist to markdown
    try {
      await fetch("/api/tasks/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldText: text, newText, date }),
      });
      onSave?.(newText);
    } catch {
      setValue(text); // Revert on failure
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setValue(text); setEditing(false); }
        }}
        className={className}
        style={{
          ...style,
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-muted)",
          borderRadius: "4px",
          padding: "2px 6px",
          outline: "none",
          width: "100%",
          minHeight: "auto",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={className}
      style={{ ...style, cursor: "text" }}
      title="Click to edit"
    >
      {text}
    </span>
  );
}
