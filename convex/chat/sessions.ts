import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";

export const getChatSessions = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    if (userId) {
      // Authenticated user - get their chat sessions
      return await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } else if (args.sessionId) {
      // Anonymous user - get session chat sessions
      return await ctx.db
        .query("chatSessions")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .order("desc")
        .collect();
    } else {
      return [];
    }
  },
});

export const validateChatAccess = query({
  args: { 
    chatSessionId: v.id("chatSessions"),
    sessionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) {
      return false; // Chat doesn't exist
    }

    if (userId) {
      // Authenticated user - check if they own this chat
      return chatSession.userId === userId;
    } else {
      // Anonymous user - check if this chat belongs to their session
      // AND the chat doesn't have a userId (meaning it's not owned by an authenticated user)
      return !chatSession.userId && chatSession.sessionId === args.sessionId;
    }
  },
});

export const createChatSession = mutation({
  args: { 
    title: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    const chatSessionId = await ctx.db.insert("chatSessions", {
      title: args.title,
      userId: userId || undefined,
      sessionId: args.sessionId,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule AI title generation
    await ctx.scheduler.runAfter(0, api.chat.titles.generateChatTitle, {
      chatSessionId,
      userMessage: args.title, // We'll pass the original message as title initially
    });

    return chatSessionId;
  },
});

export const updateChatSession = mutation({
  args: { 
    chatSessionId: v.id("chatSessions"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    if (args.title) {
      updates.title = args.title;
    }

    await ctx.db.patch(args.chatSessionId, updates);
  },
});

export const deleteChatSession = mutation({
  args: { chatSessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    // Delete all messages in this chat session
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat session
    await ctx.db.delete(args.chatSessionId);
  },
});

export const migrateSessionToUser = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Migrate chat sessions
    const sessionChatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const chatSession of sessionChatSessions) {
      await ctx.db.patch(chatSession._id, {
        userId: userId,
        sessionId: undefined,
      });
    }

    // Migrate messages
    const sessionMessages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const message of sessionMessages) {
      await ctx.db.patch(message._id, {
        userId: userId,
        sessionId: undefined,
      });
    }

    return sessionMessages.length;
  },
});
