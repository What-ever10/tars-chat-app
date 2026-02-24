"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function HomePage() {
  const { user } = useUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        Welcome, {user?.firstName}
      </h1>

      <UserButton afterSignOutUrl="/sign-in" />
    </main>
  );
}