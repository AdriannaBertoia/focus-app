"use client";

import { useEffect, useState } from "react";

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  time: string;
  app: string;
  attendees: string;
  retain: boolean;
  sections: {
    myNotes: string;
    keyTopics: string;
    decisions: string;
    actionItems: string;
    questions: string;
    nextSteps: string;
    transcript: string;
  };
}

type Tab = "summary" | "notes" | "transcript";

function MeetingCard({ meeting, onSelect }: { meeting: MeetingNote; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-4 mb-3"
      style={{
        background: "var(--bg-surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-base" style={{ color: "var(--text-primary)" }}>
            {meeting.title}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {meeting.date} {meeting.time && `at ${meeting.time}`}
          </p>
          {meeting.attendees && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {meeting.attendees}
            </p>
          )}
        </div>
        {meeting.retain && (
          <span
            className="text-xs px-2 py-1 rounded-md"
            style={{ background: "var(--status-attention-light)", color: "var(--status-attention)" }}
          >
            pinned
          </span>
        )}
      </div>
    </button>
  );
}

function MeetingDetail({ meeting, onBack }: { meeting: MeetingNote; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "notes", label: "Notes" },
    { key: "transcript", label: "Transcript" },
  ];

  return (
    <div className="px-5 pt-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm font-medium min-h-[40px]"
        style={{ color: "var(--accent)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Title */}
      <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {meeting.title}
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        {meeting.date} {meeting.time && `at ${meeting.time}`} — {meeting.attendees || "No attendees listed"}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-hover)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium"
            style={{
              background: activeTab === tab.key ? "var(--bg-surface)" : "transparent",
              color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pb-8">
        {activeTab === "summary" && (
          <div className="space-y-5">
            <Section title="Key Topics" content={meeting.sections.keyTopics} />
            <Section title="Decisions" content={meeting.sections.decisions} />
            <Section title="Action Items" content={meeting.sections.actionItems} />
            <Section title="Questions & Follow-ups" content={meeting.sections.questions} />
            <Section title="My Next Steps" content={meeting.sections.nextSteps} accent />
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            {meeting.sections.myNotes ? (
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-surface)", whiteSpace: "pre-wrap" }}
              >
                <p className="text-sm" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
                  {meeting.sections.myNotes}
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No live notes were taken during this meeting.
              </p>
            )}
          </div>
        )}

        {activeTab === "transcript" && (
          <div>
            {meeting.sections.transcript ? (
              <div
                className="rounded-xl p-4 text-sm overflow-y-auto max-h-[60vh]"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  lineHeight: "1.8",
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                }}
              >
                {meeting.sections.transcript}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No transcript available for this meeting.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content, accent }: { title: string; content: string; accent?: boolean }) {
  if (!content || content === "- (none captured)" || content === "- (none)") {
    return null;
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: accent ? "var(--accent-light)" : "var(--bg-surface)",
        border: accent ? "1px solid rgba(127, 154, 144, 0.2)" : "none",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide mb-2"
        style={{ color: accent ? "var(--accent)" : "var(--text-muted)" }}
      >
        {title}
      </p>
      <div className="text-sm" style={{ color: "var(--text-primary)", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [selected, setSelected] = useState<MeetingNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((data) => {
        setMeetings(data.meetings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (selected) {
    return <MeetingDetail meeting={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Meetings
      </h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        Your recorded meeting notes
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : meetings.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-surface)" }}
        >
          <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
            No meeting notes yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            They will appear here after your next recorded meeting
          </p>
        </div>
      ) : (
        <div>
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onSelect={() => setSelected(meeting)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
