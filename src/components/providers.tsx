"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

function SyncUser() {
  const { user } = useUser();

  const createUser = useMutation(api.users.createUser);
  const setOnline = useMutation(api.presence.setOnline);

  useEffect(() => {
    if (!user?.id) return;

    // Ensure user exists in DB
    createUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? "Unknown",
      imageUrl: user.imageUrl,
    });

    // Initial online mark
    setOnline({ clerkId: user.id });

    const interval = setInterval(() => {
      setOnline({ clerkId: user.id });
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProvider client={convex}>
        <SyncUser />
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}