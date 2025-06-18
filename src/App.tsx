import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatInterface } from "./ChatInterface";
import { Sidebar } from "./components/Sidebar";
import { SettingsPage } from "./components/SettingsPage";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";

export default function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedChatId, setSelectedChatId] = useState<Id<"chatSessions"> | null>(null);
  
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const migrateSession = useMutation(api.chat.migrateSessionToUser);
  const validateChatAccess = useQuery(api.chat.validateChatAccess, 
    selectedChatId ? { 
      chatSessionId: selectedChatId,
      sessionId: loggedInUser ? undefined : sessionId
    } : "skip"
  );

  // Handle initial URL routing
  useEffect(() => {
    const path = window.location.pathname;
    const chatIdMatch = path.match(/^\/chat\/(.+)$/);
    
    if (chatIdMatch) {
      const chatId = chatIdMatch[1] as Id<"chatSessions">;
      setSelectedChatId(chatId);
    } else {
      setSelectedChatId(null);
    }
  }, []);

  // Validate chat access for all users (authenticated and anonymous)
  useEffect(() => {
    if (selectedChatId && validateChatAccess === false) {
      // User doesn't have access to this chat, redirect to home
      toast.error("You don't have access to this chat");
      setSelectedChatId(null);
      window.history.replaceState({}, '', '/');
    }
  }, [selectedChatId, validateChatAccess]);

  // Migrate session when user signs in and close modal
  useEffect(() => {
    if (loggedInUser && !loggedInUser.isAnonymous) {
      setShowSignIn(false); // Close modal when user signs in
      migrateSession({ sessionId })
        .then((count) => {
          if (count > 0) {
            console.log(`${count} messages migrated to user account`);
          }
        })
        .catch((error) => {
          console.error("Failed to migrate session:", error);
        });
    }
  }, [loggedInUser, sessionId, migrateSession]);

  const handleNewChat = () => {
    setSelectedChatId(null);
    window.history.pushState({}, '', '/');
  };

  const handleChatCreated = (chatSessionId: Id<"chatSessions">) => {
    setSelectedChatId(chatSessionId);
    if (loggedInUser && !loggedInUser.isAnonymous) {
      window.history.pushState({}, '', `/chat/${chatSessionId}`);
    }
  };

  const handleChatSelected = (chatSessionId: Id<"chatSessions"> | null) => {
    setSelectedChatId(chatSessionId);
    if (chatSessionId) {
      window.history.pushState({}, '', `/chat/${chatSessionId}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const chatIdMatch = path.match(/^\/chat\/(.+)$/);
      
      if (chatIdMatch) {
        const chatId = chatIdMatch[1] as Id<"chatSessions">;
        setSelectedChatId(chatId);
      } else {
        setSelectedChatId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="glass-effect border-b border-gray-200/50 h-16 flex justify-between items-center px-6 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">Kiera</span>
            <span className="text-gray-800">Chat</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <Authenticated>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 font-medium">
                {loggedInUser?.email}
              </div>
              <SignOutButton />
            </div>
          </Authenticated>
          <Unauthenticated>
            <button
              onClick={() => setShowSignIn(true)}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In to Save Chats
            </button>
          </Unauthenticated>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sessionId={sessionId}
          selectedChatId={selectedChatId}
          onSelectChat={handleChatSelected}
          onNewChat={handleNewChat}
        />
        <ChatInterface
          chatSessionId={selectedChatId}
          sessionId={sessionId}
          onChatCreated={handleChatCreated}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPage onClose={() => setShowSettings(false)} />
      )}

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl animate-fade-in">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to save your conversations</p>
            </div>
            <CustomSignInForm />
          </div>
        </div>
      )}

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  );
}

function CustomSignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email address"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {flow === "signIn" ? "Signing in..." : "Signing up..."}
            </div>
          ) : (
            flow === "signIn" ? "Sign in" : "Sign up"
          )}
        </button>
        <div className="text-center text-sm text-gray-600">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium cursor-pointer transition-colors"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
