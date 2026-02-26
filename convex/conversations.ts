import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrGetConversation = mutation({
  args: {
    clerkId: v.string(),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Find existing conversations for current user
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id)
      )
      .collect();

    for (const membership of memberships) {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", membership.conversationId)
        )
        .collect();

      const isDirect =
        members.length === 2 &&
        members.some((m) => m.userId === args.otherUserId);

      if (isDirect) {
        return membership.conversationId;
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert(
      "conversations",
      {
        isGroup: false,
      }
    );

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: currentUser._id,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.otherUserId,
    });

    return conversationId;
  },
});

export const getUserConversations = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!currentUser) return [];

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id)
      )
      .collect();

    const conversations = [];

    for (const membership of memberships) {
      const conversation = await ctx.db.get(
        membership.conversationId
      );

      if (!conversation) continue;

      // Get members
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();

      const otherMember = members.find(
        (m) => m.userId !== currentUser._id
      );

      const otherUser = otherMember
        ? await ctx.db.get(otherMember.userId)
        : null;

      // Get last message
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .order("desc")
        .first();

        //get unread count
        let unreadCount = 0;
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        unreadCount = allMessages.filter((msg) => {
          // Ignore messages sent by current user
          if (
            msg.senderId.toString() ===
            currentUser._id.toString()
          ) {
            return false;
          }

          // If never read before
          if (!membership.lastReadAt) {
            return true;
          }

          return msg._creationTime > membership.lastReadAt;
        }).length;
        conversations.push({
        conversationId: conversation._id,
        otherUser,
        lastMessage,
        unreadCount,
      });
    }

    return conversations;
  },
});

export const markAsRead = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!user) return;

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) =>
        q.eq("userId", user._id)
      )
      .filter((q) =>
        q.eq(q.field("conversationId"), args.conversationId)
      )
      .unique();

    if (!membership) return;

    await ctx.db.patch(membership._id, {
      lastReadAt: Date.now(),
    });
  },
});