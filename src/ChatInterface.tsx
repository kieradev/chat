import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { MessageBubble } from "./components/MessageBubble";
import { ModelSelector } from "./components/ModelSelector";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { InputArea, FileAttachment } from "./components/InputArea";

interface ChatInterfaceProps {
  chatSessionId: Id<"chatSessions"> | null;
  sessionId: string;
  onChatCreated: (chatSessionId: Id<"chatSessions">) => void;
}

export function ChatInterface({ chatSessionId, sessionId, onChatCreated }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-lite-001");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.chat.getMessages, 
    chatSessionId ? { chatSessionId, sessionId } : "skip"
  );
  const createChatSession = useMutation(api.chat.createChatSession);
  const sendMessage = useMutation(api.chat.sendMessage);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (messageContent?: string, attachments?: FileAttachment[]) => {
    const content = messageContent || input.trim();
    if (!content && (!attachments || attachments.length === 0) || isLoading) return;

    setIsLoading(true);
    
    try {
      let currentChatId = chatSessionId;
      
      // Create new chat session if none exists
      if (!currentChatId) {
        currentChatId = await createChatSession({
          title: content.slice(0, 50),
          sessionId: loggedInUser ? undefined : sessionId,
        });
        onChatCreated(currentChatId);
      }

      // Send the message
      await sendMessage({
        content: content || "Shared files",
        chatSessionId: currentChatId,
        sessionId: loggedInUser ? undefined : sessionId,
        model: selectedModel,
        attachments,
      });

      if (!messageContent) {
        setInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAndSend = async (content: string, editMessageId: Id<"messages">) => {
    if (!chatSessionId) return;
    
    setIsLoading(true);
    
    try {
      // Send message with edit flag to replace from the edited message onwards
      await sendMessage({
        content,
        chatSessionId,
        sessionId: loggedInUser ? undefined : sessionId,
        model: selectedModel,
        editMessageId, // Pass the ID of the message being edited
      });
      
    } catch (error) {
      console.error("Error editing and sending message:", error);
      toast.error("Failed to send edited message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // This is now handled in InputArea component
    // Just pass through for other key events
  };

  const handleDemoQuery = (query: string) => {
    setInput(query);
    setTimeout(() => handleSubmit(query), 100);
  };

  if (!chatSessionId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        <WelcomeScreen 
          onQuerySelect={handleDemoQuery}
          isLoading={isLoading}
        />
        <InputArea
          input={input}
          setInput={setInput}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isLoading={isLoading}
          textareaRef={textareaRef}
          onSubmit={(attachments) => handleSubmit(input.trim() || undefined, attachments)}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages?.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            sessionId={sessionId}
            selectedModel={selectedModel}
            onEditAndSend={handleEditAndSend}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <InputArea
        input={input}
        setInput={setInput}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onSubmit={(attachments) => handleSubmit(input.trim() || undefined, attachments)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
