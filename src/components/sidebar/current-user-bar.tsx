"use client";

import { useUser, UserButton } from "@clerk/nextjs";

export function CurrentUserBar() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="p-4 border-b flex items-center gap-3">
      <img
        src={user.imageUrl}
        alt={user.fullName ?? "User"}
        className="h-10 w-10 rounded-full"
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-semibold">
          {user.fullName}
        </span>
        <span className="text-xs text-gray-500">
          You
        </span>
      </div>
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
}