import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setOnline = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!user) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: true,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        userId: user._id,
        isOnline: true,
        lastSeen: Date.now(),
      });
    }
  },
});

export const setOffline = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!user) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: false,
        lastSeen: Date.now(),
      });
    }
  },
});

export const setTyping = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!user) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) =>
        q.eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        typingConversationId: args.conversationId,
      });
    }
  },
});

export const getPresence = query({
  handler: async (ctx) => {
    return await ctx.db.query("presence").collect();
  },
});