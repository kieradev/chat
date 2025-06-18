import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { ALL_MODELS } from "./ModelSelector";

function FileDisplay({ attachment }: { attachment: any }) {
  const fileUrl = useQuery(
    api.chat.messages.getFileUrl, 
    attachment.storageId ? { storageId: attachment.storageId } : "skip"
  );
  
  const displayUrl = fileUrl || attachment.url;
  
  if (attachment.type === "image") {
    return <img src={displayUrl} alt={attachment.filename} className="max-w-full h-auto rounded-lg" />;
  } else {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">📄</div>
        <div>
          <p className="text-sm font-medium text-white">{attachment.filename}</p>
          <p className="text-xs text-white/70">PDF</p>
        </div>
      </div>
    );
  }
}

interface Message {
  _id: Id<"messages">;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  isGenerating?: boolean;
  thinking?: string;
  chatSessionId?: Id<"chatSessions">;
  attachments?: Array<{
    type: "image" | "pdf";
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    base64?: string;
  }>;
}

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: Id<"messages">) => void;
  sessionId?: string;
  selectedModel?: string;
  onEditAndSend?: (content: string, messageId: Id<"messages">) => void;
}

export function MessageBubble({ message, onRegenerate, sessionId, selectedModel, onEditAndSend }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showThinking, setShowThinking] = useState(false);
  
  const updateMessage = useMutation(api.chat.updateMessage);
  const sendMessage = useMutation(api.chat.sendMessage);
  const messages = useQuery(api.chat.getMessages, 
    message.chatSessionId ? { chatSessionId: message.chatSessionId } : "skip"
  );

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      setEditContent(message.content);
      return;
    }

    try {
      if (message.role === "user" && onEditAndSend) {
        // For user messages, trigger a new conversation with the edited content
        onEditAndSend(editContent.trim(), message._id);
        setIsEditing(false);
        toast.success("Sending new message...");
      } else {
        // For assistant messages, just update the content
        await updateMessage({
          messageId: message._id,
          content: editContent.trim(),
        });
        setIsEditing(false);
        toast.success("Message updated");
      }
    } catch (error) {
      toast.error("Failed to update message");
      setEditContent(message.content);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerate = async () => {
    if (!message.chatSessionId || !messages) return;
    
    try {
      // Find the last user message before this assistant message
      const messageIndex = messages.findIndex(m => m._id === message._id);
      let lastUserMessage = null;
      
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserMessage = messages[i];
          break;
        }
      }

      if (!lastUserMessage) {
        toast.error("No user message found to regenerate from");
        return;
      }

      // Send a new message with regenerate flag
      await sendMessage({
        content: lastUserMessage.content,
        chatSessionId: message.chatSessionId,
        sessionId,
        model: selectedModel || "google/gemini-2.0-flash-lite-001",
        regenerate: true,
      });
      
      toast.success("Regenerating response...");
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate response");
    }
  };

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-6 animate-fade-in`}>
      <div
        className={`message-bubble-modern group relative ${
          message.role === "user"
            ? "message-bubble-user-modern"
            : "message-bubble-assistant-modern"
        }`}
      >
        {/* Action buttons */}
        <div className={`absolute top-3 ${message.role === "user" ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2`}>
          {message.role === "user" ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
              title="Edit message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Copy message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {!message.isGenerating && (
                <button
                  onClick={handleRegenerate}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Regenerate response"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {message.role === "user" ? (
          isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/70 resize-none border border-white/30 focus:border-white/50 focus:outline-none transition-all duration-200"
                rows={3}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all duration-200 border border-white/30"
                >
                  Send New Message
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
              {message.attachments?.map((att, i) => (
                <div key={i} className="mt-3 bg-white/20 rounded-xl p-3">
                  <FileDisplay attachment={att} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="prose prose-sm max-w-none">
            {/* Show thinking toggle for reasoning models only */}
            {(message.thinking || message.isGenerating) && selectedModel && ALL_MODELS.find(m => m.id === selectedModel)?.isReasoning && (
              <div className="mb-4">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="flex items-center gap-3 text-sm text-purple-600 hover:text-purple-800 transition-colors p-2 rounded-lg hover:bg-purple-50"
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showThinking ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-semibold">
                    {message.isGenerating ? "Reasoning (live)" : "Show reasoning"}
                  </span>
                  {message.isGenerating && message.thinking && (
                    <div className="status-generating"></div>
                  )}
                </button>
                
                {showThinking && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                    <div className="text-sm text-purple-800 font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Chain of Thought:
                      {message.isGenerating && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                          <div className="status-generating"></div>
                          Streaming
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-purple-700 whitespace-pre-wrap font-mono bg-white/50 p-3 rounded-lg border">
                      {message.thinking || (message.isGenerating ? "Thinking..." : "")}
                      {message.isGenerating && (
                        <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-base leading-relaxed">{children}</p>,
                  code: ({ children, className }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    return !className ? (
                      <code className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono text-gray-800 border">
                        {children}
                      </code>
                    ) : (
                      <div className="my-4">
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={language}
                          PreTag="div"
                          className="rounded-xl text-sm !bg-gray-900 !p-4 !m-0 shadow-lg border"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  pre: ({ children }) => (
                    <div className="mb-4">
                      {children}
                    </div>
                  ),
                  ul: ({ children, className }) => {
                    const isTaskList = className?.includes('contains-task-list');
                    return (
                      <ul className={`mb-3 space-y-1 ${isTaskList ? 'list-none pl-0' : 'list-disc pl-6'}`}>
                        {children}
                      </ul>
                    );
                  },
                  ol: ({ children }) => (
                    <ol className="list-decimal mb-3 space-y-1 pl-6">
                      {children}
                    </ol>
                  ),
                  li: ({ children, className }) => {
                    const isTaskItem = className?.includes('task-list-item');
                    return (
                      <li className={`text-base leading-relaxed ${isTaskItem ? 'flex items-center list-none' : ''}`}>
                        {children}
                      </li>
                    );
                  },
                  input: ({ type, checked, disabled }) => {
                    if (type === 'checkbox') {
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          className="mr-2 accent-indigo-500 w-4 h-4"
                          readOnly
                        />
                      );
                    }
                    return null;
                  },
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-gray-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-gray-900">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-gray-900">{children}</h3>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  del: ({ children }) => <del className="line-through text-gray-500">{children}</del>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-300 pl-4 italic mb-4 bg-indigo-50 py-2 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200">
                      <table className="min-w-full border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-white">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="border-r border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-r border-gray-200 px-4 py-3 text-gray-700">
                      {children}
                    </td>
                  ),
                  hr: () => <hr className="border-gray-300 my-6" />,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline font-medium transition-colors"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : message.isGenerating ? (
              <div className="flex items-center space-x-3 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span className="text-gray-600 font-medium">Generating response...</span>
              </div>
            ) : (
              <div className="text-gray-500 italic py-4">
                Waiting for response...
              </div>
            )}
            
            {/* Show streaming cursor for generating content */}
            {message.isGenerating && message.content && (
              <span className="inline-block w-2 h-5 bg-indigo-400 ml-1 animate-pulse rounded-sm"></span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
          {message.role === "assistant" && message.isGenerating && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <div className="status-generating"></div>
              Generating
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
