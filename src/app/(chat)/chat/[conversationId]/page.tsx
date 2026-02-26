"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatMessageTime, formatLastSeen } from "@/lib/date";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ConversationPage() {
  const hasScrolledRef = useRef(false);
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();

  const conversationId =
    params.conversationId as Id<"conversations">;

  const [message, setMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);

  const containerRef =
    useRef<HTMLDivElement | null>(null);
  const bottomRef =
    useRef<HTMLDivElement | null>(null);
  
  const deleteMessage = useMutation(api.messages.deleteMessage);

  /* ================= QUERIES ================= */

  const rawMessages = useQuery(
    api.messages.getMessages,
    { conversationId }
  );
  const messages = rawMessages ?? [];

  const rawCurrentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const currentUser = rawCurrentUser ?? null;

  const presence =
    useQuery(api.presence.getPresence);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { clerkId: user.id } : "skip"
  );

  /* ================= MUTATIONS ================= */

  const sendMessage =
    useMutation(api.messages.sendMessage);

  const setTyping =
    useMutation(api.presence.setTyping);

  const markAsRead =
    useMutation(api.conversations.markAsRead);

  /* ================= DERIVED ================= */

  const currentConversation =
    conversations?.find(
      (c) =>
        c.conversationId.toString() ===
        conversationId.toString()
    );

  const otherUser =
    currentConversation?.otherUser;

  const userPresence = presence?.find(
    (p) =>
      p.userId.toString() ===
      otherUser?._id.toString()
  );

  const isOnline =
    userPresence &&
    Date.now() - userPresence.lastSeen < 15000;

  /* ================= SCROLL DETECTION ================= */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkIfAtBottom = () => {
      const threshold = 50;

      const atBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        threshold;

      setIsAtBottom(atBottom);
    };

    // Initial check after DOM render
    checkIfAtBottom();

    container.addEventListener(
      "scroll",
      checkIfAtBottom
    );

    return () => {
      container.removeEventListener(
        "scroll",
        checkIfAtBottom
      );
    };
  }, [conversationId, messages.length]);

  /* ================= MARK AS READ ONLY IF AT BOTTOM ================= */

  useEffect(() => {
    if (
      !user?.id ||
      !currentUser ||
      messages.length === 0 ||
      !isAtBottom
    )
      return;

    const lastMessage =
      messages[messages.length - 1];

    if (
      lastMessage.senderId.toString() !==
      currentUser._id.toString()
    ) {
      markAsRead({
        clerkId: user.id,
        conversationId,
      });
    }
  }, [
    messages,
    isAtBottom,
    user?.id,
    currentUser,
    conversationId,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !rawMessages) return;

    // Only scroll once per conversation load
    if (!hasScrolledRef.current) {
      container.scrollTop = container.scrollHeight;
      setIsAtBottom(true);
      hasScrolledRef.current = true;
    }
  }, [rawMessages, conversationId]);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [conversationId]);

  if (!rawMessages || !rawCurrentUser) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Loading conversation...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* ================= HEADER ================= */}
      <div className="border-b p-4 flex items-center gap-3">
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

          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="font-medium">
            {otherUser?.name}
          </span>

          {userPresence && (
            isOnline ? (
              <span className="text-xs text-green-600">
                Online
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                {formatLastSeen(
                  userPresence.lastSeen
                )}
              </span>
            )
          )}
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 flex justify-center"
      >
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {messages.map((msg) => {
            const isMe =
              currentUser &&
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
                  {/* Message Content + Delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {msg.deleted ? (
                        <span className="italic text-gray-400">
                          Message deleted
                        </span>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {isMe && !msg.deleted && user && (
                      <button
                        onClick={() =>
                          deleteMessage({
                            messageId: msg._id,
                            clerkId: user.id,
                          })
                        }
                        className="text-xs text-red-300 hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Timestamp (hide if deleted) */}
                  {!msg.deleted && (
                    <div className="text-xs mt-1 text-gray-400">
                      {formatMessageTime(
                        msg._creationTime
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
</div>
      {/* ================= FLOATING SCROLL BUTTON ================= */}
      {!isAtBottom && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="fixed bottom-24 right-6 bg-black text-white p-3 rounded-full shadow-lg z-50"
        >
          ↓
        </button>
      )}

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
              if (
                !message.trim() ||
                !user
              )
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