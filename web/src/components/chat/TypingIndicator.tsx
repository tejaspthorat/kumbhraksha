"use client";

import { useMemo, useEffect, useState } from "react";

interface TypingIndicatorProps {
  typingUserIds: string[];
  participants: { _id: string; name: string }[];
  className?: string;
}

export default function TypingIndicator({
  typingUserIds,
  participants,
  className = "",
}: TypingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typingUserIds.length > 0) {
      setVisible(true);
    } else {
      // Small delay before hiding to avoid flicker
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [typingUserIds.length]);

  const names = useMemo(() => {
    return typingUserIds
      .map((uid) => {
        const p = participants.find((u) => u._id === uid);
        return p?.name?.split(" ")[0] || "Someone";
      })
      .slice(0, 3);
  }, [typingUserIds, participants]);

  if (!visible || names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 ${className}`}>
      <div className="flex gap-0.5">
        <span className="typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot" style={{ animationDelay: "200ms" }} />
        <span className="typing-dot" style={{ animationDelay: "400ms" }} />
      </div>
      <span className="text-xs text-white/40 italic">{text}…</span>
    </div>
  );
}
