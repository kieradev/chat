interface DemoQuery {
  title: string;
  query: string;
  icon: string;
  gradient: string;
}

const DEMO_QUERIES: DemoQuery[] = [
  {
    title: "Latest AI news",
    query: "What are the latest developments in artificial intelligence and machine learning this week?",
    icon: "🤖",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Current weather",
    query: "What's the current weather in New York City today?",
    icon: "🌤️",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    title: "Stock market update",
    query: "How are the major stock markets performing today? Give me an overview of the current trends.",
    icon: "📈",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Recent tech news",
    query: "What are the biggest technology news stories from this week?",
    icon: "💻",
    gradient: "from-purple-500 to-indigo-500"
  },
  {
    title: "Write a Python function",
    query: "Write a Python function that finds the longest common subsequence between two strings",
    icon: "🐍",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Plan a trip to Japan",
    query: "Help me plan a 10-day trip to Japan, including must-visit places and cultural experiences",
    icon: "🗾",
    gradient: "from-pink-500 to-rose-500"
  }
];

interface DemoQueriesProps {
  onQuerySelect: (query: string) => void;
  isLoading: boolean;
}

export function DemoQueries({ onQuerySelect, isLoading }: DemoQueriesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {DEMO_QUERIES.map((demo, index) => (
        <button
          key={index}
          onClick={() => onQuerySelect(demo.query)}
          disabled={isLoading}
          className="demo-card group animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${demo.gradient} rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              {demo.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                {demo.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {demo.query}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-200 text-gray-500 opacity-60 group-hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
