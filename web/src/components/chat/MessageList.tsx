"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useChatStore, type ChatMessage, type ChatUser } from "@/lib/chatStore";
import { Check, CheckCheck, Image as ImageIcon, FileText, Film } from "lucide-react";

interface MessageListProps {
  chatId: string;
  currentUserId: string;
  participants: ChatUser[];
  onLoadMoreAction: () => void;
  onMessageVisibleAction: (messageId: string) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const EMPTY_MESSAGES: ChatMessage[] = [];

export default function MessageList({
  chatId,
  currentUserId,
  participants,
  onLoadMoreAction,
  onMessageVisibleAction,
}: MessageListProps) {
  const messages = useChatStore((s) => s.messages[chatId] || EMPTY_MESSAGES);
  const hasMore = useChatStore((s) => s.hasMoreMessages[chatId] ?? true);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (newCount > prevCount) {
      const lastMsg = messages[newCount - 1];
      const isSentByMe =
        typeof lastMsg?.sender === "object"
          ? lastMsg.sender._id === currentUserId
          : lastMsg?.sender === currentUserId;

      // Auto-scroll if sent by me or if user was near the bottom
      if (isSentByMe || isNearBottom()) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    }

    prevMessageCountRef.current = newCount;
  }, [messages.length, currentUserId]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [chatId]);

  function isNearBottom() {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 150;
  }

  // Infinite scroll — load more on scroll to top
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;

    if (scrollTop < 50 && hasMore && !messagesLoading) {
      onLoadMoreAction();
    }
  }, [hasMore, messagesLoading, onLoadMoreAction]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute("data-msg-id");
            if (msgId) onMessageVisibleAction(msgId);
          }
        }
      },
      { root: containerRef.current, threshold: 0.5 }
    );

    const messageEls = containerRef.current.querySelectorAll("[data-msg-id]");
    messageEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, onMessageVisibleAction]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1]?.messages.push(msg);
      }
    }

    return groups;
  }, [messages]);

  const getSenderName = (msg: ChatMessage) => {
    if (typeof msg.sender === "object") return msg.sender.name;
    const p = participants.find((u) => u._id === msg.sender);
    return p?.name || "Unknown";
  };

  const getSenderAvatar = (msg: ChatMessage) => {
    if (typeof msg.sender === "object") return msg.sender.avatar;
    const p = participants.find((u) => u._id === msg.sender);
    return p?.avatar || "";
  };

  const getSenderId = (msg: ChatMessage) => {
    return typeof msg.sender === "object" ? msg.sender._id : msg.sender;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
    >
      {/* Load more indicator */}
      {messagesLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !messagesLoading && messages.length > 0 && (
        <button
          onClick={onLoadMoreAction}
          className="w-full text-center py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Load older messages
        </button>
      )}

      {/* Empty state */}
      {messages.length === 0 && !messagesLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-white/30 text-sm">No messages yet. Say hello!</p>
        </div>
      )}

      {/* Message groups */}
      {groupedMessages.map((group, gi) => (
        <div key={gi}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">
              {formatDateSeparator(group.date)}
            </span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Messages */}
          {group.messages.map((msg, mi) => {
            const isOwn = getSenderId(msg) === currentUserId;
            const showAvatar =
              !isOwn &&
              (mi === 0 ||
                getSenderId(group.messages[mi - 1]!) !== getSenderId(msg));
            const senderName = getSenderName(msg);

            return (
              <div
                key={msg._id}
                data-msg-id={!isOwn ? msg._id : undefined}
                className={`flex gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className="w-7 flex-shrink-0">
                  {showAvatar && !isOwn && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-light to-accent flex items-center justify-center mt-1">
                      {getSenderAvatar(msg) ? (
                        <img
                          src={getSenderAvatar(msg)}
                          alt={senderName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-white">
                          {getInitials(senderName)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[75%] group ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender name for group chats */}
                  {showAvatar && !isOwn && (
                    <p className="text-[10px] text-white/30 font-medium mb-0.5 ml-1">
                      {senderName}
                    </p>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2 ${
                      isOwn
                        ? "bg-gradient-to-r from-primary-light/80 to-primary/80 text-white rounded-br-md"
                        : "bg-white/5 text-white/85 border border-white/6 rounded-bl-md"
                    }`}
                  >
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-1.5 space-y-1">
                        {msg.attachments.map((att, ai) => (
                          <div key={ai}>
                            {att.type === "image" ? (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-w-48 max-h-48 rounded-lg object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs"
                              >
                                {att.type === "video" ? (
                                  <Film size={14} className="text-accent" />
                                ) : (
                                  <FileText size={14} className="text-accent" />
                                )}
                                <span className="truncate max-w-32">{att.name}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}

                    {/* Time + read status */}
                    <div
                      className={`flex items-center gap-1 mt-0.5 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-[10px] text-white/20">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwn && (
                        <span className="text-white/30">
                          {msg.readBy && msg.readBy.length > 0 ? (
                            <CheckCheck size={12} className="text-accent" />
                          ) : msg.deliveredAt ? (
                            <CheckCheck size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
