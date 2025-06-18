import { v } from "convex/values";
import { action } from "./_generated/server";

// Web search tool using Serper API
export const webSearch = action({
  args: {
    query: v.string(),
    numResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": "4739a11ee2c610ccadd7e44808b5fb13c91a035b",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: args.query,
          num: args.numResults || 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Return simplified search results
      return {
        query: args.query,
        knowledgeGraph: data.knowledgeGraph || null,
        organic: (data.organic || []).map((result: any) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          position: result.position,
        })),
        peopleAlsoAsk: (data.peopleAlsoAsk || []).slice(0, 3).map((item: any) => ({
          question: item.question,
          snippet: item.snippet,
        })),
        relatedSearches: (data.relatedSearches || []).slice(0, 5).map((item: any) => item.query),
      };
    } catch (error) {
      console.error("Web search error:", error);
      throw new Error("Failed to perform web search");
    }
  },
});

// Extract content from URL tool
export const extractContent = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Use a simple content extraction approach
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();
      
      // Basic content extraction (remove scripts, styles, and extract text)
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Get the first 3000 characters to avoid token limits
      const content = cleanText.slice(0, 10000);
      
      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No title found";

      return {
        url: args.url,
        title,
        content,
        contentLength: cleanText.length,
        truncated: cleanText.length > 3000,
      };
    } catch (error) {
      console.error("Content extraction error:", error);
      throw new Error(`Failed to extract content from URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
