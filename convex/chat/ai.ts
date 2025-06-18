import { v } from "convex/values";
import { query, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";

// Define available tools
const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on any topic. Use this when you need up-to-date information or when the user asks about recent events, news, or specific facts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information"
          },
          numResults: {
            type: "number",
            description: "Number of search results to return (default: 10, max: 20)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "extract_content",
      description: "Extract the main content from a specific webpage URL. Use this after web search to get detailed information from a specific source.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL of the webpage to extract content from"
          }
        },
        required: ["url"]
      }
    }
  }
];

export const canUseModel = query({
  args: { 
    model: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Define model access rules - matches ModelSelector.tsx
    const modelAccess = {
      // Google models
      "google/gemini-2.0-flash-lite-001": { requiresAuth: false, tier: "free", available: true },
			"google/gemini-2.5-flash-preview-05-20": { requiresAuth: true, tier: "free", available: true },
			"google/gemini-2.5-flash-preview-05-20:thinking": { requiresAuth: true, tier: "free", available: true },
			"google/gemma-3-27b-it": { requiresAuth: false, tier: "free", available: true },
      "google/gemini-2.0-flash-exp": { requiresAuth: true, tier: "premium", available: false },
      "google/gemini-1.5-pro": { requiresAuth: true, tier: "premium", available: false },
      // Deepseek models
      "deepseek/deepseek-r1-0528-qwen3-8b": { requiresAuth: true, tier: "free", available: true },
      "deepseek/deepseek-r1-0528": { requiresAuth: true, tier: "free", available: true },
			"deepseek/deepseek-chat-v3-0324": { requiresAuth: true, tier: "free", available: true },
      // Anthropic models
      "anthropic/claude-3.5-sonnet": { requiresAuth: true, tier: "premium", available: false },
      "anthropic/claude-3.5-haiku": { requiresAuth: true, tier: "premium", available: false },
      "anthropic/claude-3-opus": { requiresAuth: true, tier: "premium", available: false },
      // OpenAI models
      "openai/chatgpt-4o-latest": { requiresAuth: true, tier: "free", available: true },
      "openai/gpt-4o-mini": { requiresAuth: true, tier: "premium", available: false },
      "openai/o4-mini": { requiresAuth: true, tier: "free", available: true },
      // Meta models
      "meta/llama-3.3-70b": { requiresAuth: true, tier: "premium", available: false },
      "meta/llama-3.2-11b": { requiresAuth: true, tier: "premium", available: false },
      // Mistral models
      "mistralai/mistral-7b-instruct": { requiresAuth: true, tier: "free", available: true },
      "mistral/mistral-medium": { requiresAuth: true, tier: "premium", available: false },
      // Qwen models
      "qwen/qwen3-32b": { requiresAuth: true, tier: "free", available: true },
      "qwen/qwen3-235b-a22b": { requiresAuth: true, tier: "free", available: true },
    };

    const access = modelAccess[args.model as keyof typeof modelAccess];
    
    // If model not in our list, assume it's not available
    if (!access) {
      return false;
    }

    // Check if model is available
    if (!access.available) {
      return false;
    }

    // Check if model requires authentication
    if (access.requiresAuth && !args.userId) {
      return false;
    }

    return true;
  },
});

export const generateAIResponseStream = action({
  args: { 
    userMessage: v.string(),
    chatSessionId: v.id("chatSessions"),
    aiMessageId: v.id("messages"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    model: v.string(),
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
    try {
      // Get recent messages for context
      const recentMessages = await ctx.runQuery(api.chat.messages.getMessages, {
        chatSessionId: args.chatSessionId,
      });

      // Build conversation context (last 10 messages, excluding the placeholder)
      const contextMessages = recentMessages
        .filter(msg => msg._id !== args.aiMessageId)
        .slice(-10)
        .map(msg => {
          if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
            if (supportsVision) {
              const content: any[] = [{ type: "text", text: msg.content }];
              for (const att of msg.attachments) {
                if (att.type === "image" && (att as any).base64) {
                  content.push({ type: "image_url", image_url: { url: (att as any).base64 } });
                }
              }
              return { role: msg.role, content };
            } else {
              let textContent = msg.content;
              for (const att of msg.attachments) {
                textContent += `\n[Attached ${att.type}: ${att.filename}]`;
              }
              return { role: msg.role, content: textContent };
            }
          }
          return { role: msg.role, content: msg.content };
        });

      // Check if user has access to the selected model
      const canUseModel = await ctx.runQuery(api.chat.ai.canUseModel, {
        model: args.model,
        userId: args.userId,
      });

      if (!canUseModel) {
        throw new Error("You don't have access to this model. Please sign in or select a different model.");
      }

      // Check if this is a reasoning model
      const isReasoningModel = args.model.includes('deepseek-r1') || 
                              args.model.includes('o4') || 
															args.model.includes('thinking') || 
                              args.model.includes('qwen3');

      // Check if this model supports vision (images)
      const supportsVision = args.model.includes('gemini') || 
                            args.model.includes('gpt-4') || 
                            args.model.includes('claude');

			const today = new Intl.DateTimeFormat('en-GB', {weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'}).format(new Date());
			
      // Prepare request body with tools		
      const requestBody: any = {
        model: args.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a platform called 'KieraChat' with access to web search and content extraction tools. Use these tools when you need current information, recent news, or specific details from websites. Do not ask for confirmation to use tools, just use them. Always provide accurate, helpful, and well-sourced responses. If you did not find the information you wanted with the first search, feel free to search again. Remember that when accessing wikipedia articles, you should append '&action=raw', this gives you just the wikitext allowing you to skip any uneeded boilerplate HTML; so for example if querying the https://en.wikipedia.org/w/index.php?title=Pet_door url, change it to https://en.wikipedia.org/w/index.php?title=Pet_door&action=raw. The date is "+ today +"."
          },
          ...contextMessages
        ],
        max_tokens: 4000,
        temperature: 0.7,
        stream: true,
        tools: AVAILABLE_TOOLS,
      };

      // Add reasoning effort for reasoning models
      if (isReasoningModel) {
        requestBody.reasoning_effort = "medium";
      }

      let fullContent = "";
      let thinking = "";
      let toolCallsBuffer = "";
      let isInToolCall = false;

      // Start the conversation loop for tool calling
      let conversationMessages = [...requestBody.messages];
      let maxIterations = 5; // Prevent infinite loops
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration++;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer <ADD YOUR API KEY HERE INCLUDING REPLACING ANGLE BRACKETS>",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...requestBody,
            messages: conversationMessages,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let updateCounter = 0;
        let hasToolCalls = false;
        let toolCalls: any[] = [];
        let assistantMessage = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  
                  let shouldUpdate = false;
                  
                  // Handle reasoning content (thinking)
                  if (delta?.reasoning) {
                    thinking += delta.reasoning;
                    shouldUpdate = true;
                  }
                  
                  // Handle regular content
                  const content = delta?.content;
                  if (content) {
                    assistantMessage += content;
                    fullContent += content;
                    shouldUpdate = true;
                  }

                  // Handle tool calls
                  if (delta?.tool_calls) {
                    hasToolCalls = true;
                    for (const toolCall of delta.tool_calls) {
                      if (!toolCalls[toolCall.index]) {
                        toolCalls[toolCall.index] = {
                          id: toolCall.id,
                          type: toolCall.type,
                          function: { name: "", arguments: "" }
                        };
                      }
                      
                      if (toolCall.function?.name) {
                        toolCalls[toolCall.index].function.name += toolCall.function.name;
                      }
                      if (toolCall.function?.arguments) {
                        toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                      }
                    }
                    shouldUpdate = true;
                  }

                  updateCounter++;
                  const updateFrequency = isReasoningModel ? 3 : 10;
                  
                  if (shouldUpdate && (updateCounter % updateFrequency === 0 || content?.includes(' ') || delta?.reasoning)) {
                    let displayContent = fullContent;
                    
                    // Show tool calling status
                    if (hasToolCalls && toolCalls.length > 0) {
                      const toolNames = toolCalls.map(tc => tc.function?.name).filter(Boolean);
                      if (toolNames.length > 0) {
                        displayContent += `\n\n🔍 Using tools: ${toolNames.join(', ')}...`;
                      }
                    }

                    await ctx.runMutation(api.chat.messages.updateAIMessage, {
                      messageId: args.aiMessageId,
                      content: displayContent,
                      thinking: thinking || undefined,
                      isGenerating: true,
                    });
                  }
                } catch (e) {
                  console.log("Failed to parse JSON:", data);
                  continue;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // If we have tool calls, execute them
        if (hasToolCalls && toolCalls.length > 0) {
          // Add the assistant message with tool calls to conversation
          conversationMessages.push({
            role: "assistant",
            content: assistantMessage || null,
            tool_calls: toolCalls.filter(tc => tc.function?.name)
          });

          // Execute each tool call
          for (const toolCall of toolCalls) {
            if (!toolCall.function?.name) continue;

            let toolResult = "";
            try {
              const args = JSON.parse(toolCall.function.arguments);
              
              if (toolCall.function.name === "web_search") {
                const searchResult = await ctx.runAction(api.tools.webSearch, {
                  query: args.query,
                  numResults: args.numResults || 10,
                });
                toolResult = JSON.stringify(searchResult);
              } else if (toolCall.function.name === "extract_content") {
                const contentResult = await ctx.runAction(api.tools.extractContent, {
                  url: args.url,
                });
                toolResult = JSON.stringify(contentResult);
              }
            } catch (error) {
              toolResult = `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
            }

            // Add tool result to conversation
            conversationMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: toolResult,
            });
          }

          // Update the message to show tool execution
          await ctx.runMutation(api.chat.messages.updateAIMessage, {
            messageId: args.aiMessageId,
            content: fullContent + "\n\n🔍 Tools executed, generating response...",
            thinking: thinking || undefined,
            isGenerating: true,
          });

          // Continue the loop to get the final response
          continue;
        } else {
          // No tool calls, we're done
          break;
        }
      }

      // Final update to ensure we have the complete message and mark as complete
      if (!fullContent) {
        fullContent = "Sorry, I couldn't generate a response.";
      }
      
      await ctx.runMutation(api.chat.messages.updateAIMessage, {
        messageId: args.aiMessageId,
        content: fullContent,
        thinking: thinking || undefined,
        isGenerating: false,
      });

    } catch (error) {
      console.error("Error generating AI response:", error);
      
      await ctx.runMutation(api.chat.messages.updateAIMessage, {
        messageId: args.aiMessageId,
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        isGenerating: false,
      });
    }
  },
});

// New function to check for incomplete messages and retry generation
export const retryIncompleteMessages = action({
  args: {},
  handler: async (ctx, args) => {
    // Find messages that are still marked as generating but are older than 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    // This would require a custom query, but for now we'll handle it in the UI
    // by checking the isGenerating flag and showing appropriate status
  },
});
