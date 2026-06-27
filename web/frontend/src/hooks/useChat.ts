"use client";

import { useCallback } from "react";
import { useChatStore, type ChatMessage, type Conversation } from "@/lib/chatStore";
import { useShallow } from "zustand/react/shallow";

const SOCKET_API = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

async function apiFetch(path: string, options: RequestInit = {}) {
  const socketUserId = useChatStore.getState().socketUserId;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (socketUserId) {
    headers["x-user-id"] = socketUserId;
  }

  const res = await fetch(`${SOCKET_API}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export function useChat() {
  const {
    setConversations,
    setConversationsLoading,
    addConversation,
    setMessages,
    prependMessages,
    setMessagesLoading,
    setHasMore,
    setNextCursor,
  } = useChatStore(
    useShallow((s) => ({
      setConversations: s.setConversations,
      setConversationsLoading: s.setConversationsLoading,
      addConversation: s.addConversation,
      setMessages: s.setMessages,
      prependMessages: s.prependMessages,
      setMessagesLoading: s.setMessagesLoading,
      setHasMore: s.setHasMore,
      setNextCursor: s.setNextCursor,
    }))
  );

  // ─── Fetch Conversations ──────────────────────────────────────

  const fetchConversations = useCallback(
    async (page = 1, limit = 20, q = "") => {
      setConversationsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (q) params.set("q", q);

        const res = await apiFetch(`/api/chats?${params}`, {});
        setConversations(res.data || res);
        return res;
      } catch (err) {
        console.error("[Chat] Failed to fetch conversations:", err);
        throw err;
      } finally {
        setConversationsLoading(false);
      }
    },
    [setConversations, setConversationsLoading]
  );

  // ─── Fetch Messages ──────────────────────────────────────────

  const fetchMessages = useCallback(
    async (chatId: string, before?: string, limit = 30) => {
      setMessagesLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (before) params.set("before", before);

        const res = await apiFetch(
          `/api/chats/${chatId}/messages?${params}`,
          {}
        );

        const messages: ChatMessage[] = res.data || res;
        const pagination = res.pagination;

        if (before) {
          // Loading older messages, prepend
          prependMessages(chatId, messages);
        } else {
          // Initial load
          setMessages(chatId, messages);
        }

        if (pagination) {
          setHasMore(chatId, pagination.hasMore);
          setNextCursor(chatId, pagination.nextCursor || null);
        }

        return res;
      } catch (err) {
        console.error("[Chat] Failed to fetch messages:", err);
        throw err;
      } finally {
        setMessagesLoading(false);
      }
    },
    [setMessages, prependMessages, setMessagesLoading, setHasMore, setNextCursor]
  );

  // ─── Create Conversation ─────────────────────────────────────

  const createConversation = useCallback(
    async (participantIds: string[], isGroup = false, groupName?: string): Promise<Conversation> => {
      try {
        const body: Record<string, any> = {
          participants: participantIds,
          isGroup,
        };
        if (isGroup && groupName) body.groupName = groupName;

        const conversation = await apiFetch(
          "/api/chats",
          { method: "POST", body: JSON.stringify(body) }
        );

        if (!conversation.alreadyExisted) {
          addConversation(conversation);
        }

        return conversation;
      } catch (err) {
        console.error("[Chat] Failed to create conversation:", err);
        throw err;
      }
    },
    [addConversation]
  );

  // ─── Send Message via REST (fallback) ─────────────────────────

  const sendMessageRest = useCallback(
    async (chatId: string, text: string, attachments: any[] = []) => {
      try {
        const message = await apiFetch(
          `/api/chats/${chatId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ text, attachments }),
          }
        );
        return message;
      } catch (err) {
        console.error("[Chat] Failed to send message via REST:", err);
        throw err;
      }
    },
    []
  );

  // ─── Upload Attachment ────────────────────────────────────────

  const uploadAttachment = useCallback(
    async (file: File) => {
      const socketUserId = useChatStore.getState().socketUserId;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${SOCKET_API}/api/chats/upload`, {
        method: "POST",
        headers: socketUserId ? { "x-user-id": socketUserId } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      return res.json();
    },
    []
  );

  // ─── Update Participants ──────────────────────────────────────

  const updateParticipants = useCallback(
    async (chatId: string, action: "add" | "remove", userId: string) => {
      try {
        return await apiFetch(
          `/api/chats/${chatId}/participants`,
          {
            method: "PATCH",
            body: JSON.stringify({ action, userId }),
          }
        );
      } catch (err) {
        console.error("[Chat] Failed to update participants:", err);
        throw err;
      }
    },
    []
  );

  // ─── Fetch all users for participant picker ────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      return await apiFetch("/api/users", {});
    } catch (err) {
      console.error("[Chat] Failed to fetch users:", err);
      throw err;
    }
  }, []);

  return {
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessageRest,
    uploadAttachment,
    updateParticipants,
    fetchUsers,
  };
}
