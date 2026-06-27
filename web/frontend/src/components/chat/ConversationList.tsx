"use client";

import { useMemo, useState } from "react";
import { useChatStore, type Conversation, type ChatUser } from "@/lib/chatStore";
import { Search, Users, MessageSquarePlus } from "lucide-react";

interface ConversationListProps {
  currentUserId: string;
  onSelectAction: (conversationId: string) => void;
  onNewChatAction: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationList({
  currentUserId,
  onSelectAction,
  onNewChatAction,
}: ConversationListProps) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const conversationsLoading = useChatStore((s) => s.conversationsLoading);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      if (c.groupName && c.groupName.toLowerCase().includes(q)) return true;
      if (c.participant?.name?.toLowerCase().includes(q)) return true;
      if (c.participants?.some((p: any) => p.name?.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [conversations, search]);

  const getDisplayInfo = (conv: Conversation) => {
    if (conv.isGroup) {
      return {
        name: conv.groupName || "Group Chat",
        avatar: null,
        isOnline: false,
        isGroup: true,
      };
    }

    const other = conv.participant || conv.participants?.find(
      (p: any) => (p._id || p) !== currentUserId
    );

    const otherUser = other as ChatUser | null;
    return {
      name: otherUser?.name || "Unknown",
      avatar: otherUser?.avatar || "",
      isOnline: otherUser ? onlineUsers.includes(otherUser._id) : false,
      isGroup: false,
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Messages</h2>
          <button
            onClick={onNewChatAction}
            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-soft transition-all"
            title="New conversation"
          >
            <MessageSquarePlus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-surface-soft border border-hairline rounded-lg pl-9 pr-3 py-2 text-xs text-body placeholder-muted-soft focus:outline-none focus:border-accent/20 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversationsLoading && conversations.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!conversationsLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center mb-3">
              <MessageSquarePlus size={20} className="text-muted-soft" />
            </div>
            <p className="text-xs text-muted">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
            {!search && (
              <button
                onClick={onNewChatAction}
                className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Start a conversation
              </button>
            )}
          </div>
        )}

        {filtered.map((conv) => {
          const info = getDisplayInfo(conv);
          const isActive = activeId === conv._id;
          const chatTyping = typingUsers[conv._id] || [];
          const hasTyping = chatTyping.length > 0;

          // Calculate unread count (messages where sender !== currentUser and not in readBy)
          const messages = useChatStore.getState().messages[conv._id] || [];
          const unreadCount = messages.filter((m) => {
            const senderId =
              typeof m.sender === "object" ? m.sender._id : m.sender;
            if (senderId === currentUserId) return false;
            return !m.readBy?.some((r) => r.userId === currentUserId);
          }).length;

          return (
            <button
              key={conv._id}
              onClick={() => onSelectAction(conv._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-b border-hairline ${
                isActive
                  ? "bg-primary-light/10 border-l-2 border-l-accent"
                  : "hover:bg-surface-soft"
              }`}
              role="listitem"
              aria-current={isActive ? "true" : undefined}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light/60 to-accent/60 flex items-center justify-center">
                  {info.isGroup ? (
                    <Users size={16} className="text-on-primary" />
                  ) : info.avatar ? (
                    <img
                      src={info.avatar}
                      alt={info.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-on-primary">
                      {getInitials(info.name)}
                    </span>
                  )}
                </div>
                {/* Online indicator */}
                {info.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-canvas" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink truncate">
                    {info.name}
                  </span>
                  <span className="text-[10px] text-muted-soft flex-shrink-0">
                    {formatLastTime(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted truncate max-w-36">
                    {hasTyping ? (
                      <span className="text-accent italic">typing…</span>
                    ) : (
                      conv.lastMessageText || "No messages yet"
                    )}
                  </p>
                  {unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/80 text-[10px] font-bold text-on-primary flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
