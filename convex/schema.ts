import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),           // Clerk user ID
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    isGroup: v.boolean(),
    name: v.optional(v.string()), // group name
  }),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    deleted: v.boolean(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  presence: defineTable({
    userId: v.id("users"),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    isTyping: v.optional(v.boolean()),
    typingConversationId: v.optional(v.id("conversations")),
  }).index("by_user", ["userId"]),
});