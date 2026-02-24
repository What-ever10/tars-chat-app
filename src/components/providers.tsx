"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

function SyncUser() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (!user?.id) return;

    createUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? "Unknown",
      imageUrl: user.imageUrl,
    });
  }, [user?.id]);

  return null;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ConvexProvider client={convex}>
        <SyncUser />
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}