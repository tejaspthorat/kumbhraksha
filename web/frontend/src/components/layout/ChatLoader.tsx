"use client";

import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with socket.io-client
const ChatWrapper = dynamic(() => import("../chat/ChatWrapper"), {
  ssr: false,
});

export default function ChatLoader() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn || !user) return null;

  const name =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "User";
  const email = user.primaryEmailAddress?.emailAddress || "";
  const avatar = user.imageUrl || "";

  if (!email) return null;

  return (
    <ChatWrapper
      clerkUserId={user.id}
      userName={name}
      userEmail={email}
      userAvatar={avatar}
    />
  );
}
