"use client";

import { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";

const SOCKET_API = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface ChatWrapperProps {
  clerkUserId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

/**
 * ChatWrapper handles user sync with the socket server's MongoDB User collection.
 * It registers the Clerk user with the socket backend and then renders the ChatPanel.
 */
export default function ChatWrapper({
  clerkUserId,
  userName,
  userEmail,
  userAvatar = "",
}: ChatWrapperProps) {
  const [socketUserId, setSocketUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync user with socket server (register/login via authCallback)
    async function syncUser() {
      try {
        const res = await fetch(`${SOCKET_API}/api/auth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userName,
            email: userEmail,
            avatar: userAvatar,
          }),
        });

        if (!res.ok) {
          throw new Error(`User sync failed: ${res.status}`);
        }

        const user = await res.json();
        setSocketUserId(user._id);
      } catch (err: any) {
        console.error("[Chat] Failed to sync user:", err);
        setError(err.message);
      }
    }

    if (clerkUserId && userName && userEmail) {
      syncUser();
    }
  }, [clerkUserId, userName, userEmail, userAvatar]);

  // Don't render chat if feature is disabled
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED === "false") return null;

  // Loading state
  if (!socketUserId && !error) return null;

  // Error state — silently fail, don't block the dashboard
  if (error) {
    console.warn("[Chat] Chat unavailable:", error);
    return null;
  }

  return <ChatPanel socketUserId={socketUserId!} />;
}
