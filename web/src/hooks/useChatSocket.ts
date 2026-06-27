"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore, type ChatMessage } from "@/lib/chatStore";
import { useShallow } from "zustand/react/shallow";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const TYPING_TIMEOUT = 5000; // Auto-hide typing after 5s of no updates

export function useChatSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const {
    setConnected,
    setSocketUserId,
    addMessage,
    updateConversationLastMessage,
    setTyping,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    updateReadReceipt,
    updateDeliveryReceipt,
  } = useChatStore(
    useShallow((s) => ({
      setConnected: s.setConnected,
      setSocketUserId: s.setSocketUserId,
      addMessage: s.addMessage,
      updateConversationLastMessage: s.updateConversationLastMessage,
      setTyping: s.setTyping,
      setOnlineUsers: s.setOnlineUsers,
      addOnlineUser: s.addOnlineUser,
      removeOnlineUser: s.removeOnlineUser,
      updateReadReceipt: s.updateReadReceipt,
      updateDeliveryReceipt: s.updateDeliveryReceipt,
    }))
  );

  // Connect to socket on mount
  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      auth: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setSocketUserId(userId);

    socket.on("connect", () => {
      setConnected(true);
      console.log("[Chat] Socket connected");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("[Chat] Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("[Chat] Connection error:", err.message);
      setConnected(false);
    });

    // ─── Online Users ──────────────────────────────────────────

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      setOnlineUsers(userIds);
    });

    socket.on("user-online", ({ userId: uid }: { userId: string }) => {
      addOnlineUser(uid);
    });

    socket.on("user-offline", ({ userId: uid }: { userId: string }) => {
      removeOnlineUser(uid);
    });

    // ─── New Message ───────────────────────────────────────────

    socket.on("new-message", (message: ChatMessage) => {
      const chatId =
        typeof message.chat === "string" ? message.chat : (message.chat as any)?._id;
      if (chatId) {
        addMessage(chatId, message);
        updateConversationLastMessage(chatId, message);
      }
    });

    // ─── Delivery Receipt ──────────────────────────────────────

    socket.on("delivery-receipt", ({ messageId }: { messageId: string }) => {
      updateDeliveryReceipt(messageId);
    });

    // ─── Read Receipt ──────────────────────────────────────────

    socket.on(
      "read-receipt",
      ({
        messageId,
        userId: readUserId,
      }: {
        messageId: string;
        userId: string;
        at: string;
      }) => {
        // Find the chatId for this message from store
        const state = useChatStore.getState();
        for (const [chatId, msgs] of Object.entries(state.messages)) {
          if (msgs.some((m) => m._id === messageId)) {
            updateReadReceipt(chatId, messageId, readUserId);
            break;
          }
        }
      }
    );

    // ─── Typing Indicator ──────────────────────────────────────

    socket.on(
      "typing",
      ({
        chatId,
        userId: typingUserId,
        isTyping,
      }: {
        chatId: string;
        userId: string;
        isTyping: boolean;
      }) => {
        // Don't show own typing
        if (typingUserId === userId) return;

        setTyping(chatId, typingUserId, isTyping);

        // Auto-clear typing after timeout
        const key = `${chatId}:${typingUserId}`;
        if (typingTimeouts.current[key]) {
          clearTimeout(typingTimeouts.current[key]);
        }

        if (isTyping) {
          typingTimeouts.current[key] = setTimeout(() => {
            setTyping(chatId, typingUserId, false);
            delete typingTimeouts.current[key];
          }, TYPING_TIMEOUT);
        } else {
          delete typingTimeouts.current[key];
        }
      }
    );

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);

      // Clear all typing timeouts
      for (const timeout of Object.values(typingTimeouts.current)) {
        clearTimeout(timeout);
      }
      typingTimeouts.current = {};
    };
  }, [userId]);

  // ─── Actions ──────────────────────────────────────────────────

  const joinChat = useCallback((chatId: string) => {
    socketRef.current?.emit("join-chat", chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketRef.current?.emit("leave-chat", chatId);
  }, []);

  const sendMessage = useCallback(
    (chatId: string, text: string, attachments: any[] = []) => {
      socketRef.current?.emit("send-message", { chatId, text, attachments });
    },
    []
  );

  const emitTyping = useCallback((chatId: string, isTyping: boolean) => {
    socketRef.current?.emit("typing", { chatId, isTyping });
  }, []);

  const markRead = useCallback((chatId: string, messageId: string) => {
    socketRef.current?.emit("mark-read", { chatId, messageId });
  }, []);

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    sendMessage,
    emitTyping,
    markRead,
  };
}
