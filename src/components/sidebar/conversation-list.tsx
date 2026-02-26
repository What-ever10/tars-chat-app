"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useRouter } from "next/navigation";
import { formatMessageTime } from "@/lib/date";

export function ConversationList() {
  const { user } = useUser();
  const router = useRouter();

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { clerkId: user.id } : "skip"
  );

  const presence = useQuery(api.presence.getPresence);

  if (!conversations) {
    return (
      <div className="text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500 text-center">
          No conversations yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conv) => {
        // 🔥 Heartbeat-based online detection
        const userPresence = presence?.find(
          (p) =>
            p.userId.toString() ===
            conv.otherUser?._id.toString()
        );

        const isOnline =
          userPresence &&
          Date.now() - userPresence.lastSeen < 15000;

        return (
          <div
            key={conv.conversationId}
            onClick={() =>
              router.push(`/chat/${conv.conversationId}`)
            }
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            {/* Avatar + Online Indicator */}
            <div className="relative">
              <img
                src={conv.otherUser?.imageUrl}
                alt={conv.otherUser?.name}
                className="h-10 w-10 rounded-full"
              />

              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Name + Preview */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-sm truncate">
                {conv.otherUser?.name}
              </span>

              <span className="text-xs text-gray-500 truncate">
                {conv.lastMessage?.content ?? "No messages yet"}
              </span>
            </div>

            {/* Right Side (Timestamp + Unread Badge) */}
            <div className="flex flex-col items-end gap-1">
              {conv.lastMessage && (
                <span className="text-xs text-gray-400">
                  {formatMessageTime(
                    conv.lastMessage._creationTime
                  )}
                </span>
              )}

              {conv.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}