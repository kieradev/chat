import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Simple streaming endpoint
http.route({
  path: "/api/chat/stream",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { chatSessionId, aiMessageId } = body;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await generateAIStream(ctx, chatSessionId, aiMessageId, controller);
        } catch (error) {
          console.error("Stream error:", error);
          const encoder = new TextEncoder();
          const errorMessage = "Sorry, I encountered an error.";
          await ctx.runMutation(api.chat.updateAIMessage, {
            messageId: aiMessageId,
            content: errorMessage,
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, content: errorMessage })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

async function generateAIStream(
  ctx: any, 
  chatSessionId: Id<"chatSessions">, 
  aiMessageId: Id<"messages">, 
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder();
  
  try {
    const recentMessages = await ctx.runQuery(api.chat.getMessages, {
      chatSessionId,
    });

    const contextMessages = recentMessages
      .filter((msg: any) => msg._id !== aiMessageId)
      .slice(-10)
      .map((msg: any) => ({ role: msg.role, content: msg.content }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          ...contextMessages
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let fullContent = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                
                // Send chunk to client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, fullContent })}\n\n`));
                
                // Update database
                await ctx.runMutation(api.chat.updateAIMessage, {
                  messageId: aiMessageId,
                  content: fullContent,
                });
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullContent) {
      fullContent = "Sorry, I couldn't generate a response.";
      await ctx.runMutation(api.chat.updateAIMessage, {
        messageId: aiMessageId,
        content: fullContent,
      });
    }

    // Send completion signal
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`));

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = "Sorry, I encountered an error.";
    await ctx.runMutation(api.chat.updateAIMessage, {
      messageId: aiMessageId,
      content: errorMessage,
    });
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, content: errorMessage })}\n\n`));
  }
}

// File upload endpoint
http.route({
  path: "/api/upload",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response("No file", { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const storageId = await ctx.storage.store(new Blob([buffer], { type: file.type }));
    const url = await ctx.storage.getUrl(storageId);

    return new Response(JSON.stringify({
      url, storageId, filename: file.name, size: file.size, mimeType: file.type
    }), { headers: { "Content-Type": "application/json" } });
  }),
});

export default http;
