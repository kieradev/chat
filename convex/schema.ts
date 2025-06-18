import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  chatSessions: defineTable({
    title: v.string(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()), // For anonymous users
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
    
  messages: defineTable({
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    chatSessionId: v.optional(v.id("chatSessions")),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
    isGenerating: v.optional(v.boolean()), // Track if AI is still generating
    thinking: v.optional(v.string()), // Chain of thought for reasoning models
    attachments: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("pdf")),
      url: v.string(),
      filename: v.string(),
      size: v.number(),
      mimeType: v.string(),
      base64: v.optional(v.string()),
      storageId: v.optional(v.string()),
    }))), // File attachments
  }).index("by_chat_session", ["chatSessionId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_generating", ["isGenerating"]),

  userSettings: defineTable({
    userId: v.id("users"),
    settings: v.object({
      defaultModel: v.string(),
      theme: v.string(),
      fontSize: v.string(),
      showThinkingByDefault: v.boolean(),
      autoSaveChats: v.boolean(),
      enableNotifications: v.boolean(),
      language: v.string(),
      maxTokens: v.number(),
      temperature: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
