"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useChatStore, type ChatUser } from "@/lib/chatStore";
import { useShallow } from "zustand/react/shallow";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useChat } from "@/hooks/useChat";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import TypingIndicator from "./TypingIndicator";
import {
  MessageCircle,
  X,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Users,
  UserPlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatPanelProps {
  socketUserId: string;
}

export default function ChatPanel({ socketUserId }: ChatPanelProps) {
  const {
    chatPanelOpen,
    toggleChatPanel,
    setChatPanelOpen,
    activeConversationId,
    setActiveConversation,
    conversations,
    typingUsers,
    isConnected,
    onlineUsers,
  } = useChatStore(
    useShallow((s) => ({
      chatPanelOpen: s.chatPanelOpen,
      toggleChatPanel: s.toggleChatPanel,
      setChatPanelOpen: s.setChatPanelOpen,
      activeConversationId: s.activeConversationId,
      setActiveConversation: s.setActiveConversation,
      conversations: s.conversations,
      typingUsers: s.typingUsers,
      isConnected: s.isConnected,
      onlineUsers: s.onlineUsers,
    }))
  );

  const { joinChat, leaveChat, sendMessage, emitTyping, markRead } =
    useChatSocket(socketUserId);
  const {
    fetchConversations,
    fetchMessages,
    createConversation,
    uploadAttachment,
    fetchUsers,
  } = useChat();

  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const prevChatIdRef = useRef<string | null>(null);

  // Set the socket user ID in the store
  useEffect(() => {
    useChatStore.getState().setSocketUserId(socketUserId);
  }, [socketUserId]);

  // Fetch conversations on mount
  useEffect(() => {
    if (socketUserId) {
      fetchConversations().catch(() => {});
    }
  }, [socketUserId, fetchConversations]);

  // Handle active conversation change
  useEffect(() => {
    if (activeConversationId && activeConversationId !== prevChatIdRef.current) {
      // Leave previous chat room
      if (prevChatIdRef.current) {
        leaveChat(prevChatIdRef.current);
      }

      // Join new chat room
      joinChat(activeConversationId);

      // Fetch messages
      fetchMessages(activeConversationId).catch(() => {});

      prevChatIdRef.current = activeConversationId;
    }
  }, [activeConversationId, joinChat, leaveChat, fetchMessages]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
      setMobileView("chat");
    },
    [setActiveConversation]
  );

  const handleSendMessage = useCallback(
    (text: string, attachments: any[]) => {
      if (!activeConversationId) return;
      sendMessage(activeConversationId, text, attachments);
    },
    [activeConversationId, sendMessage]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      emitTyping(activeConversationId, isTyping);
    },
    [activeConversationId, emitTyping]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      return uploadAttachment(file);
    },
    [uploadAttachment]
  );

  const handleLoadMore = useCallback(() => {
    if (!activeConversationId) return;
    const cursor = useChatStore.getState().nextCursors[activeConversationId];
    if (cursor) {
      fetchMessages(activeConversationId, cursor).catch(() => {});
    }
  }, [activeConversationId, fetchMessages]);

  const handleMessageVisible = useCallback(
    (messageId: string) => {
      if (!activeConversationId) return;
      markRead(activeConversationId, messageId);
    },
    [activeConversationId, markRead]
  );

  const handleNewChat = useCallback(async () => {
    setShowNewChat(true);
    setUsersLoading(true);
    try {
      const users = await fetchUsers();
      setAvailableUsers(users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [fetchUsers]);

  const handleSelectUser = useCallback(
    async (user: ChatUser) => {
      try {
        const conv = await createConversation([user._id]);
        setShowNewChat(false);
        handleSelectConversation(conv._id);
        // Refresh conversations
        fetchConversations().catch(() => {});
      } catch (err) {
        console.error("Failed to create conversation:", err);
      }
    },
    [createConversation, handleSelectConversation, fetchConversations]
  );

  const handleBackToList = useCallback(() => {
    setMobileView("list");
    setActiveConversation(null);
  }, [setActiveConversation]);

  // Get active conversation details
  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const activeTyping = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];

  const getConvName = () => {
    if (!activeConv) return "";
    if (activeConv.isGroup) return activeConv.groupName || "Group Chat";
    return activeConv.participant?.name || "Chat";
  };

  const getConvOnline = () => {
    if (!activeConv) return false;
    if (activeConv.isGroup) return true;
    return activeConv.participant
      ? onlineUsers.includes(activeConv.participant._id)
      : false;
  };

  const participants: ChatUser[] = activeConv?.participants || [];

  return (
    <>
      {/* ─── Floating toggle button ───────────────────────────────── */}
      <button
        onClick={toggleChatPanel}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          chatPanelOpen
            ? "bg-surface-soft backdrop-blur-xl border border-hairline scale-90"
            : "bg-gradient-to-r from-primary-light to-accent hover:shadow-accent/30 hover:scale-105 active:scale-95"
        }`}
        title={chatPanelOpen ? "Close chat" : "Open chat"}
      >
        {chatPanelOpen ? (
          <X size={20} className="text-body" />
        ) : (
          <MessageCircle size={22} className="text-on-primary" />
        )}

        {/* Connection indicator */}
        <span
          className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-canvas ${
            isConnected ? "bg-emerald-400" : "bg-red-400"
          }`}
        />
      </button>

      {/* ─── Chat Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {chatPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-40 w-full sm:w-[420px] lg:w-[480px] max-w-full flex flex-col bg-canvas border-l border-hairline shadow-2xl shadow-black/40"
          >
            {/* ─── New Chat Modal ───────────────────────────────────── */}
            {showNewChat && (
              <div className="absolute inset-0 z-50 bg-canvas flex flex-col">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-hairline">
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-surface-soft transition-all"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h3 className="text-sm font-semibold text-ink">
                    New Conversation
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <p className="text-center text-xs text-muted py-8">
                      No users available
                    </p>
                  ) : (
                    availableUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-soft transition-colors"
                      >
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light/60 to-accent/60 flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-on-primary">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          {onlineUsers.includes(user._id) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-canvas" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-ink">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-muted">{user.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── Main Chat UI ─────────────────────────────────────── */}
            <div className="flex h-full">
              {/* Conversation list — hidden on mobile when chat is active */}
              <div
                className={`${
                  mobileView === "chat"
                    ? "hidden sm:flex"
                    : "flex"
                } w-full sm:w-[200px] lg:w-[220px] flex-shrink-0 border-r border-hairline flex-col`}
              >
                <ConversationList
                  currentUserId={socketUserId}
                  onSelectAction={(id) => {
                    setActiveConversation(id);
                    setChatPanelOpen(true);
                  }}
                  onNewChatAction={handleNewChat}
                />
              </div>

              {/* Chat view */}
              <div
                className={`${
                  mobileView === "list"
                    ? "hidden sm:flex"
                    : "flex"
                } flex-1 flex-col min-w-0`}
              >
                {activeConversationId && activeConv ? (
                  <>
                    {/* Chat header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline bg-canvas">
                      {/* Back button on mobile */}
                      <button
                        onClick={handleBackToList}
                        className="sm:hidden p-1 rounded-lg text-muted hover:text-body transition-colors"
                      >
                        <ArrowLeft size={18} />
                      </button>

                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light/60 to-accent/60 flex items-center justify-center">
                          {activeConv.isGroup ? (
                            <Users size={14} className="text-on-primary" />
                          ) : activeConv.participant?.avatar ? (
                            <img
                              src={activeConv.participant.avatar}
                              alt={getConvName()}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-on-primary">
                              {getConvName()
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          )}
                        </div>
                        {getConvOnline() && !activeConv.isGroup && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-canvas" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-ink truncate">
                          {getConvName()}
                        </h3>
                        <p className="text-[10px] text-muted">
                          {activeConv.isGroup
                            ? `${participants.length} members`
                            : getConvOnline()
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>

                      {/* Connection status */}
                      <div className="flex items-center gap-1 text-muted-soft">
                        {isConnected ? (
                          <Wifi size={14} className="text-emerald-400/60" />
                        ) : (
                          <WifiOff size={14} className="text-red-400/60" />
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <MessageList
                      chatId={activeConversationId}
                      currentUserId={socketUserId}
                      participants={participants}
                      onLoadMoreAction={handleLoadMore}
                      onMessageVisibleAction={handleMessageVisible}
                    />

                    {/* Typing indicator */}
                    <TypingIndicator
                      typingUserIds={activeTyping}
                      participants={participants}
                    />

                    {/* Composer */}
                    <MessageComposer
                      onSend={handleSendMessage}
                      onTyping={handleTyping}
                      onUpload={handleUpload}
                      disabled={!isConnected}
                    />
                  </>
                ) : (
                  /* No chat selected */
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light/10 to-accent/10 flex items-center justify-center">
                      <MessageCircle
                        size={32}
                        className="text-muted-soft"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted mb-1">
                        Staff Chat
                      </h3>
                      <p className="text-xs text-muted-soft max-w-48">
                        Select a conversation or start a new one to begin messaging
                      </p>
                    </div>
                    <button
                      onClick={handleNewChat}
                      className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-light/20 to-accent/20 border border-accent/15 text-xs font-medium text-accent hover:bg-accent/10 transition-all"
                    >
                      <UserPlus size={14} className="inline mr-1.5 -mt-0.5" />
                      New Conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
