"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with socket.io-client
const ChatWrapper = dynamic(() => import("../chat/ChatWrapper"), {
  ssr: false,
});

/**
 * Auth has been removed — the dashboard runs as a single shared "Control Room"
 * identity, so the chat connects with a fixed user instead of a Clerk session.
 */
export default function ChatLoader() {
  return (
    <ChatWrapper
      clerkUserId="control-room"
      userName="Control Room"
      userEmail="control@kumbhraksha.local"
      userAvatar=""
    />
  );
}
