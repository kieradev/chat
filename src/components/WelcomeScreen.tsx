import { DemoQueries } from "./DemoQueries";

interface WelcomeScreenProps {
  onQuerySelect: (query: string) => void;
  isLoading: boolean;
}

export function WelcomeScreen({ 
  onQuerySelect, 
  isLoading 
}: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 relative overflow-hidden">

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
        <div className="text-center max-w-4xl w-full mx-auto">
          {/* Hero Section */}
          <div className="mb-12 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl glow floating">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">Start a New</span>
              <br />
              <span className="text-gray-900">Conversation</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Experience AI with web search capabilities. Get real-time information, browse websites, and chat with intelligent assistants.
            </p>
          </div>

          {/* Demo Queries */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <DemoQueries onQuerySelect={onQuerySelect} isLoading={isLoading} />
          </div>

          {/* Info Section */}
          <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI with Web Search</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our AI assistants can search the web for current information, extract content from websites, 
                  and provide up-to-date answers. Try asking about recent news, current events, or specific websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
