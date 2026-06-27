import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Attachment {
  url: string;
  type: "image" | "file" | "video";
  name: string;
  size: number;
}

export interface ReadReceipt {
  userId: string;
  at: string;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: ChatUser | string;
  text: string;
  attachments: Attachment[];
  readBy: ReadReceipt[];
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  isGroup: boolean;
  groupName: string | null;
  participants: ChatUser[];
  participant: ChatUser | null; // For 1-on-1 chats
  lastMessage: ChatMessage | null;
  lastMessageText: string | null;
  lastMessageAt: string;
  createdAt: string;
  alreadyExisted?: boolean;
}

export interface TypingUser {
  userId: string;
  chatId: string;
  isTyping: boolean;
  timeout?: ReturnType<typeof setTimeout>;
}

interface ChatState {
  // Connection state
  socketUserId: string | null;
  isConnected: boolean;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  conversationsLoading: boolean;

  // Messages
  messages: Record<string, ChatMessage[]>; // keyed by chatId
  messagesLoading: boolean;
  hasMoreMessages: Record<string, boolean>;
  nextCursors: Record<string, string | null>;

  // Typing
  typingUsers: Record<string, string[]>; // chatId -> userIds

  // Online users
  onlineUsers: string[];

  // Chat panel state
  chatPanelOpen: boolean;

  // Actions
  setSocketUserId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  setChatPanelOpen: (open: boolean) => void;
  toggleChatPanel: () => void;

  setConversations: (conversations: Conversation[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversationLastMessage: (chatId: string, message: ChatMessage) => void;

  setActiveConversation: (id: string | null) => void;

  setMessages: (chatId: string, messages: ChatMessage[]) => void;
  prependMessages: (chatId: string, messages: ChatMessage[]) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  setMessagesLoading: (loading: boolean) => void;
  setHasMore: (chatId: string, hasMore: boolean) => void;
  setNextCursor: (chatId: string, cursor: string | null) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  clearTypingTimeout: (chatId: string, userId: string) => void;

  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;

  updateReadReceipt: (chatId: string, messageId: string, userId: string) => void;
  updateDeliveryReceipt: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  socketUserId: null,
  isConnected: false,
  conversations: [],
  activeConversationId: null,
  conversationsLoading: false,
  messages: {},
  messagesLoading: false,
  hasMoreMessages: {},
  nextCursors: {},
  typingUsers: {},
  onlineUsers: [],
  chatPanelOpen: false,

  // ─── Connection ──────────────────────────────────────────────

  setSocketUserId: (id) => set({ socketUserId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
  toggleChatPanel: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen })),

  // ─── Conversations ───────────────────────────────────────────

  setConversations: (conversations) => set({ conversations }),
  setConversationsLoading: (loading) => set({ conversationsLoading: loading }),

  addConversation: (conversation) =>
    set((s) => {
      // Don't add duplicates
      if (s.conversations.some((c) => c._id === conversation._id)) {
        return s;
      }
      return { conversations: [conversation, ...s.conversations] };
    }),

  updateConversationLastMessage: (chatId, message) =>
    set((s) => {
      const updated = s.conversations.map((c) => {
        if (c._id === chatId) {
          return {
            ...c,
            lastMessage: message,
            lastMessageText: message.text?.substring(0, 100) || null,
            lastMessageAt: message.createdAt,
          };
        }
        return c;
      });
      // Re-sort by lastMessageAt
      updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      return { conversations: updated };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  // ─── Messages ────────────────────────────────────────────────

  setMessages: (chatId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [chatId]: messages },
    })),

  prependMessages: (chatId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: [...messages, ...(s.messages[chatId] || [])],
      },
    })),

  addMessage: (chatId, message) =>
    set((s) => {
      const existing = s.messages[chatId] || [];
      // Deduplicate
      if (existing.some((m) => m._id === message._id)) {
        return s;
      }
      return {
        messages: {
          ...s.messages,
          [chatId]: [...existing, message],
        },
      };
    }),

  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

  setHasMore: (chatId, hasMore) =>
    set((s) => ({
      hasMoreMessages: { ...s.hasMoreMessages, [chatId]: hasMore },
    })),

  setNextCursor: (chatId, cursor) =>
    set((s) => ({
      nextCursors: { ...s.nextCursors, [chatId]: cursor },
    })),

  // ─── Typing ──────────────────────────────────────────────────

  setTyping: (chatId, userId, isTyping) =>
    set((s) => {
      const current = s.typingUsers[chatId] || [];
      if (isTyping) {
        if (current.includes(userId)) return s;
        return {
          typingUsers: {
            ...s.typingUsers,
            [chatId]: [...current, userId],
          },
        };
      } else {
        return {
          typingUsers: {
            ...s.typingUsers,
            [chatId]: current.filter((id) => id !== userId),
          },
        };
      }
    }),

  clearTypingTimeout: (_chatId, _userId) => {
    // Typing timeouts are managed externally in the socket hook
  },

  // ─── Online Users ────────────────────────────────────────────

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
  addOnlineUser: (userId) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.includes(userId)
        ? s.onlineUsers
        : [...s.onlineUsers, userId],
    })),
  removeOnlineUser: (userId) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.filter((id) => id !== userId),
    })),

  // ─── Read/Delivery Receipts ──────────────────────────────────

  updateReadReceipt: (chatId, messageId, userId) =>
    set((s) => {
      const msgs = s.messages[chatId];
      if (!msgs) return s;
      return {
        messages: {
          ...s.messages,
          [chatId]: msgs.map((m) => {
            if (m._id === messageId) {
              const alreadyRead = m.readBy.some((r) => r.userId === userId);
              if (alreadyRead) return m;
              return {
                ...m,
                readBy: [
                  ...m.readBy,
                  { userId, at: new Date().toISOString() },
                ],
              };
            }
            return m;
          }),
        },
      };
    }),

  updateDeliveryReceipt: (messageId) =>
    set((s) => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [chatId, msgs] of Object.entries(s.messages)) {
        updated[chatId] = msgs.map((m) => {
          if (m._id === messageId && !m.deliveredAt) {
            return { ...m, deliveredAt: new Date().toISOString() };
          }
          return m;
        });
      }
      return { messages: { ...s.messages, ...updated } };
    }),
}));
