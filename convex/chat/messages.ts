import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";

export const getMessages = query({
  args: { 
    chatSessionId: v.optional(v.id("chatSessions")),
    sessionId: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    if (!args.chatSessionId) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .order("asc")
      .collect();
  },
});

export const sendMessage = mutation({
  args: { 
    content: v.string(),
    chatSessionId: v.id("chatSessions"),
    sessionId: v.optional(v.string()),
    model: v.optional(v.string()),
    regenerate: v.optional(v.boolean()),
    editMessageId: v.optional(v.id("messages")), // ID of message being edited
    attachments: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("pdf")),
      url: v.string(),
      filename: v.string(),
      size: v.number(),
      mimeType: v.string(),
      base64: v.optional(v.string()),
      storageId: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    // If this is an edit, delete all messages from the edited message onwards
    if (args.editMessageId) {
      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
        .order("asc")
        .collect();

      const editIndex = allMessages.findIndex(m => m._id === args.editMessageId);
      if (editIndex !== -1) {
        // Delete all messages from the edited message onwards
        const messagesToDelete = allMessages.slice(editIndex);
        for (const message of messagesToDelete) {
          await ctx.db.delete(message._id);
        }
      }
    }

    // If this is a regenerate request, delete the assistant message being regenerated
    if (args.regenerate) {
      // Find and delete the assistant message that's being regenerated
      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
        .order("asc")
        .collect();

      // Find the last assistant message and delete it
      for (let i = allMessages.length - 1; i >= 0; i--) {
        if (allMessages[i].role === "assistant") {
          await ctx.db.delete(allMessages[i]._id);
          break;
        }
      }
    } else {
      // Insert user message (only if not regenerating)
      await ctx.db.insert("messages", {
        content: args.content,
        role: "user",
        chatSessionId: args.chatSessionId,
        userId: userId || undefined,
        sessionId: args.sessionId,
        timestamp: Date.now(),
        attachments: args.attachments,
      });
    }

    // Create placeholder AI message for streaming
    const aiMessageId = await ctx.db.insert("messages", {
      content: "",
      role: "assistant",
      chatSessionId: args.chatSessionId,
      userId: userId || undefined,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      isGenerating: true, // Mark as generating
    });

    // Update chat session timestamp
    await ctx.db.patch(args.chatSessionId, {
      updatedAt: Date.now(),
    });

    // Schedule AI response generation - this runs independently of the client
    await ctx.scheduler.runAfter(0, api.chat.ai.generateAIResponseStream, {
      userMessage: args.content,
      chatSessionId: args.chatSessionId,
      aiMessageId: aiMessageId,
      userId: userId || undefined,
      sessionId: args.sessionId,
      model: args.model || "google/gemini-2.0-flash-lite-001",
      attachments: args.attachments,
    });

    return aiMessageId;
  },
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Get the message to verify ownership
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user owns this message (for authenticated users)
    if (userId && message.userId !== userId) {
      throw new Error("Not authorized to edit this message");
    }

    // For anonymous users, check session ID
    if (!userId && message.sessionId !== args.messageId) {
      // We can't easily verify session ownership for anonymous users
      // so we'll allow the edit for now
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      timestamp: Date.now(),
    });
  },
});

export const updateAIMessage = mutation({
  args: { 
    messageId: v.id("messages"),
    content: v.string(),
    thinking: v.optional(v.string()),
    isGenerating: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      content: args.content,
      timestamp: Date.now(),
    };
    
    if (args.thinking !== undefined) {
      updates.thinking = args.thinking;
    }
    
    if (args.isGenerating !== undefined) {
      updates.isGenerating = args.isGenerating;
    }

    await ctx.db.patch(args.messageId, updates);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
