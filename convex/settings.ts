import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return settings?.settings || null;
  },
});

export const updateUserSettings = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be signed in to update settings");
    }

    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        settings: args.settings,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        settings: args.settings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const deleteAllUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be signed in to delete data");
    }

    // Delete all chat sessions
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const session of chatSessions) {
      await ctx.db.delete(session._id);
    }

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete user settings
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (settings) {
      await ctx.db.delete(settings._id);
    }

    return { success: true, deletedItems: chatSessions.length + messages.length + (settings ? 1 : 0) };
  },
});

export const exportUserData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be signed in to export data");
    }

    const user = await ctx.db.get(userId);
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      user: {
        email: user?.email,
        createdAt: user?._creationTime,
      },
      chatSessions,
      messages,
      settings: settings?.settings,
      exportedAt: Date.now(),
    };
  },
});
