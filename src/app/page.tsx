"use client";

import { useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HomePage() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (!user) return;

    createUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? "Unknown",
      imageUrl: user.imageUrl,
    });
  }, [user, createUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        Welcome, {user?.firstName}
      </h1>

      <UserButton afterSignOutUrl="/sign-in" />
    </main>
  );
}