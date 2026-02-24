"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

export function UserList() {
  const { user } = useUser();
  const [search, setSearch] = useState("");

  const users = useQuery(
    api.users.getUsers,
    user
      ? {
          clerkId: user.id,
          search,
        }
      : "skip"
  );

const router = useRouter();
const createOrGetConversation = useMutation(
  api.conversations.createOrGetConversation
);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search users..."
        className="rounded-md border px-3 py-2 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        {users?.map((u) => (
          <div
            key={u._id}
            onClick={async () => {
                if (!user) return;

                const conversationId =
                await createOrGetConversation({
                    clerkId: user.id,
                    otherUserId: u._id,
                });

                router.push(`/chat/${conversationId}`);
            }}
            className="flex items-center gap-3 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
            >
            <img
              src={u.imageUrl}
              alt={u.name}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium">{u.name}</span>
          </div>
        ))}

        {users && users.length === 0 && (
          <p className="text-sm text-gray-500">
            No chats found
          </p>
        )}
      </div>
    </div>
  );
}