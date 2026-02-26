"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatMessageTime, formatLastSeen } from "@/lib/date";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function ConversationPage() {
  const { user } = useUser();
  const params = useParams();
  const conversationId =
    params.conversationId as Id<"conversations">;

  const [message, setMessage] = useState("");

  const messages = useQuery(api.messages.getMessages, {
    conversationId,
  });

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const presence = useQuery(api.presence.getPresence);
  const allUsers = useQuery(api.users.getAllUsers);

  const sendMessage = useMutation(api.messages.sendMessage);
  const setTyping = useMutation(api.presence.setTyping);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { clerkId: user.id } : "skip"
  );

  const currentConversation = conversations?.find(
    (c) =>
      c.conversationId.toString() ===
      conversationId.toString()
  );

  const otherUser = currentConversation?.otherUser;
  const router = useRouter();
  const markAsRead = useMutation(api.conversations.markAsRead);
  useEffect(() => {
    if (!user?.id) return;

    markAsRead({
      clerkId: user.id,
      conversationId,
    });
  }, [conversationId, user?.id]);
  if (!messages || !currentUser) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Loading conversation...
      </div>
    );
  }


  return (
    <div className="flex h-full w-full flex-col">
      {/* ================= HEADER ================= */}
      <div className="border-b p-4 flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => router.push("/")}
          className="md:hidden text-gray-600 mr-2"
        >
          ←
        </button>
        <div className="relative">
          <img
            src={otherUser?.imageUrl}
            alt={otherUser?.name}
            className="h-10 w-10 rounded-full"
          />
          {presence?.map((p) => {
            if (
              p.userId.toString() !==
              otherUser?._id.toString()
            )
              return null;

            const isOnline =
              Date.now() - p.lastSeen < 15000;

            if (!isOnline) return null;

            return (
              <span
                key={p._id}
                className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"
              />
            );
          })}
        </div>

        <div className="flex flex-col">
          <span className="font-medium">
            {otherUser?.name}
          </span>

          {presence?.map((p) => {
            if (
              p.userId.toString() !==
              otherUser?._id.toString()
            )
              return null;

            const isOnline =
              Date.now() - p.lastSeen < 15000;

            if (isOnline) {
              return (
                <span
                  key={p._id}
                  className="text-xs text-green-600"
                >
                  Online
                </span>
              );
            }

            return (
              <span
                key={p._id}
                className="text-xs text-gray-500"
              >
                {formatLastSeen(p.lastSeen)}
              </span>
            );
          })}
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {/* Typing Indicator */}
          {presence?.map((p) => {
            const isTyping =
              p.typingConversationId?.toString() ===
                conversationId.toString() &&
              p.isTyping &&
              p.userId.toString() !==
                currentUser._id.toString();

            if (!isTyping) return null;

            const typingUser = allUsers?.find(
              (u) =>
                u._id.toString() ===
                p.userId.toString()
            );

            return (
              <div
                key={p._id}
                className="text-sm text-gray-500 italic"
              >
                {typingUser?.name ?? "Someone"} is
                typing...
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              <p className="text-sm">
                No messages yet. Say hello 👋
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe =
              msg.senderId.toString() ===
              currentUser._id.toString();

            return (
              <div
                key={msg._id}
                className={`flex ${
                  isMe
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? "bg-black text-white"
                      : "bg-white border"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{msg.content}</span>
                    <span
                      className={`text-xs mt-1 ${
                        isMe
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(
                        msg._creationTime
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= INPUT ================= */}
      <div className="border-t p-4 flex justify-center">
        <div className="w-full max-w-2xl flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              if (!user) return;

              setTyping({
                clerkId: user.id,
                conversationId,
                isTyping:
                  e.target.value.length > 0,
              });
            }}
            placeholder="Type a message..."
          />

          <button
            className="rounded-md bg-black text-white px-4"
            onClick={async () => {
              if (!message.trim() || !user)
                return;

              await sendMessage({
                conversationId,
                clerkId: user.id,
                content: message,
              });

              await setTyping({
                clerkId: user.id,
                conversationId,
                isTyping: false,
              });

              setMessage("");
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}