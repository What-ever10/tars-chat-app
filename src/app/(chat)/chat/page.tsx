"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function ChatPage() {
  const { user } = useUser();

  const users = useQuery(
    api.users.getUsers,
    user
      ? {
          clerkId: user.id,
          search: "",
        }
      : "skip"
  );

  // Still loading
  if (users === undefined) {
    return null;
  }

  // No other users exist
  if (users.length === 0) {
    return null;
  }

  // Users exist → show placeholder
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      Select a conversation
    </div>
  );
}