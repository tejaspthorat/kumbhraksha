"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send } from "lucide-react";
import AttachmentPicker from "./AttachmentPicker";

interface MessageComposerProps {
  onSend: (text: string, attachments: any[]) => void;
  onTyping: (isTyping: boolean) => void;
  onUpload: (file: File) => Promise<any>;
  disabled?: boolean;
}

export default function MessageComposer({
  onSend,
  onTyping,
  onUpload,
  disabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Refocus textarea
    textareaRef.current?.focus();
  }, [text, attachments, onSend, onTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);

      // Typing indicator — debounce
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 2000);
    },
    [onTyping]
  );

  const handleBlur = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [onTyping]);

  const handleAttach = useCallback((attachment: any) => {
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canSend = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="border-t border-hairline bg-canvas">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 flex-wrap">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-soft border border-hairline text-xs"
            >
              {att.type === "image" ? "🖼️" : att.type === "video" ? "🎬" : "📄"}
              <span className="text-body max-w-24 truncate">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="text-muted hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer row */}
      <div className="flex items-end gap-2 px-4 py-3">
        <AttachmentPicker
          onUpload={onUpload}
          onAttach={handleAttach}
          disabled={disabled}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Type a message…"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-surface-soft border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink placeholder-muted-soft focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/20 transition-all duration-200 scrollbar-thin"
          aria-label="Type a message"
          aria-multiline="true"
          style={{ maxHeight: "120px" }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || !canSend}
          className="p-2.5 rounded-xl bg-gradient-to-r from-primary-light to-accent text-on-primary disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-accent/20 transition-all duration-200 active:scale-95"
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
