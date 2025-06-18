import { v } from "convex/values";
import { action, mutation } from "../_generated/server";
import { api } from "../_generated/api";

export const generateChatTitle = action({
  args: { 
    chatSessionId: v.id("chatSessions"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer <ADD YOUR API KEY HERE INCLUDING REPLACING ANGLE BRACKETS>",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001",
          messages: [
            {
              role: "system",
              content: `Generate a summary title for this user request, ensuring it is below 30 characters, is entirely in plain text and uses no markdown and summarises the request in ~2-5 words: ${args.userMessage}`
            }
          ],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiTitle = data.choices[0]?.message?.content?.trim() || "New Chat";
      
      // Ensure title is under 30 characters and remove any markdown
      const cleanTitle = aiTitle.replace(/[*_`#\[\]]/g, '').trim();
      const finalTitle = cleanTitle.length > 30 ? cleanTitle.substring(0, 27) + "..." : cleanTitle;

      // Update the chat session with the AI-generated title
      await ctx.runMutation(api.chat.titles.updateChatSessionTitle, {
        chatSessionId: args.chatSessionId,
        title: finalTitle,
      });
    } catch (error) {
      console.error("Error generating chat title:", error);
      // If AI title generation fails, use a fallback based on the original message
      const fallbackTitle = args.userMessage.trim().slice(0, 27);
      const finalFallbackTitle = fallbackTitle.length < args.userMessage.trim().length ? fallbackTitle + "..." : fallbackTitle;
      
      await ctx.runMutation(api.chat.titles.updateChatSessionTitle, {
        chatSessionId: args.chatSessionId,
        title: finalFallbackTitle,
      });
    }
  },
});

export const updateChatSessionTitle = mutation({
  args: { 
    chatSessionId: v.id("chatSessions"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatSessionId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});
