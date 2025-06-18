import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SidebarProps {
  sessionId: string;
  selectedChatId: Id<"chatSessions"> | null;
  onSelectChat: (chatId: Id<"chatSessions"> | null) => void;
  onNewChat: () => void;
}

export function Sidebar({ sessionId, selectedChatId, onSelectChat, onNewChat }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<Id<"chatSessions"> | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const chatSessions = useQuery(api.chat.getChatSessions, { sessionId }) || [];
  const updateChatSession = useMutation(api.chat.updateChatSession);
  const deleteChatSession = useMutation(api.chat.deleteChatSession);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleEditStart = (chatSession: any) => {
    setEditingId(chatSession._id);
    setEditTitle(chatSession.title);
  };

  const handleEditSave = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      await updateChatSession({
        chatSessionId: editingId,
        title: editTitle.trim(),
      });
      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      toast.error("Failed to update chat title");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = async (chatSessionId: Id<"chatSessions">) => {
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteChatSession({ chatSessionId });
      if (selectedChatId === chatSessionId) {
        onSelectChat(null);
      }
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'} flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Chat History</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        
        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="p-2">
            {chatSessions.length === 0 ? (
              <div className="text-center text-gray-400 mt-8 px-4">
                <p className="text-sm">No chats yet</p>
                <p className="text-xs mt-1">
                  {loggedInUser 
                    ? "Start a new conversation!" 
                    : "Sign in to save your chats"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.map((chatSession) => (
                  <div
                    key={chatSession._id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChatId === chatSession._id
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => onSelectChat(chatSession._id)}
                  >
                    {editingId === chatSession._id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleEditSave}
                          className="text-green-400 hover:text-green-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate pr-2">{chatSession.title}</h3>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(chatSession);
                              }}
                              className="p-1 hover:bg-gray-600 rounded"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chatSession._id);
                              }}
                              className="p-1 hover:bg-gray-600 rounded text-red-400"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(chatSession.updatedAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
          {loggedInUser ? (
            <div className="text-sm">
              <p className="text-gray-300">Signed in as:</p>
              <p className="font-medium truncate">{loggedInUser.email}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              <p>Anonymous session</p>
              <p className="text-xs">Sign in to save chats</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
