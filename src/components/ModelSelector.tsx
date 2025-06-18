import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const MODEL_COMPANIES = {
  google: {
    name: "Google",
    color: "bg-blue-500",
    models: [
      {
        id: "google/gemini-2.0-flash-lite-001",
        name: "Gemini 2.0 Flash-Lite",
        description: "Fast and efficient for most tasks",
        available: true,
        requiresAuth: false,
        tier: "free",
        isReasoning: false
      },
      {
        id: "google/gemma-3-27b-it",
        name: "Gemma 3 27B",
        description: "Google's most advanced open model.",
        available: true,
        requiresAuth: false,
        tier: "free",
        isReasoning: false
      },
			{
        id: "google/gemini-2.5-flash-preview-05-20",
        name: "Gemini 2.5 Flash",
        description: "Google's faster flagship model",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: false
      },
			{
        id: "google/gemini-2.5-flash-preview-05-20:thinking",
        name: "Gemini 2.5 Flash Thinking",
        description: "Thinking version of Google's lastest flash model.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      },
      {
        id: "google/gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Advanced reasoning with long context",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      }
    ]
  },
  deepseek: {
    name: "Deepseek",
    color: "bg-indigo-500",
    models: [
      {
        id: "deepseek/deepseek-r1-0528-qwen3-8b",
        name: "Deepseek: R1 0528 Qwen3 8B",
        description: "Flagship model at bite-sized speed.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      },
      {
        id: "deepseek/deepseek-r1-0528",
        name: "DeepSeek: R1 0528",
        description: "Deepseek's Frontier Model",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      },
			{
        id: "deepseek/deepseek-chat-v3-0324",
        name: "DeepSeek: V3 0324",
        description: "Deepseek's Frontier Non-Reasoning Model.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: false
      }
    ]
  },
  anthropic: {
    name: "Anthropic",
    color: "bg-orange-500",
    models: [
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        description: "Advanced reasoning and analysis",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      },
      {
        id: "anthropic/claude-3.5-haiku",
        name: "Claude 3.5 Haiku",
        description: "Fast and efficient Claude model",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      },
      {
        id: "anthropic/claude-3-opus",
        name: "Claude 3 Opus",
        description: "Most capable Claude model",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      }
    ]
  },
  openai: {
    name: "OpenAI",
    color: "bg-green-500",
    models: [
      {
        id: "openai/chatgpt-4o-latest",
        name: "GPT-4o",
        description: "OpenAI's standard model.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: false
      },
			{
        id: "openai/o4-mini",
        name: "o4 Mini",
        description: "Rapid and intelligent thinking model.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Faster and more affordable",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      },
    ]
  },
  meta: {
    name: "Meta",
    color: "bg-purple-500",
    models: [
			{
        id: "meta/llama-3.3-70b",
        name: "Llama 3.3 70B",
        description: "Open source large language model",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      },
      {
        id: "meta/llama-3.2-11b",
        name: "Llama 3.2 11B",
        description: "Efficient open source model",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      }
    ]
  },
  mistral: {
    name: "Mistral AI",
    color: "bg-red-500",
    models: [
      {
        id: "mistralai/mistral-7b-instruct",
        name: "Mistral 7B Instruct",
        description: "Ultra-Fast Model",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: false
      },
      {
        id: "mistral/mistral-medium",
        name: "Mistral Medium",
        description: "Balanced performance",
        available: false,
        requiresAuth: true,
        tier: "premium",
        isReasoning: false
      }
    ]
  },
	qwen: {
    name: "Qwen",
    color: "bg-pink-500",
    models: [
      {
        id: "qwen/qwen3-32b",
        name: "Qwen3 32B",
        description: "Punches above it's weight.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      },
      {
        id: "qwen/qwen3-235b-a22b",
        name: "Qwen3 235B A22B",
        description: "Qwen frontier reasoning model.",
        available: true,
        requiresAuth: true,
        tier: "free",
        isReasoning: true
      }
    ]
  }
};

// Get all models in a flat array for easy searching
const ALL_MODELS = Object.values(MODEL_COMPANIES).flatMap(company => 
  company.models.map(model => ({ ...model, company: company.name, companyColor: company.color }))
);

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelSelect, className = "" }: ModelSelectorProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const selectedModelInfo = ALL_MODELS.find(m => m.id === selectedModel) || ALL_MODELS[0];

  // Filter models based on search and company selection
  const filteredModels = ALL_MODELS.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = !selectedCompany || model.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  // Group filtered models by company
  const groupedModels = Object.entries(MODEL_COMPANIES).reduce((acc, [key, company]) => {
    const companyModels = filteredModels.filter(model => model.company === company.name);
    if (companyModels.length > 0) {
      (acc as any)[key] = { ...company, models: companyModels };
    }
    return acc;
  }, {} as typeof MODEL_COMPANIES);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowModelSelector(!showModelSelector)}
        className="model-selector-button"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${selectedModelInfo.companyColor}`}></div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900">{selectedModelInfo.name}</div>
            <div className="text-xs text-gray-500">{selectedModelInfo.company}</div>
          </div>
          <div className="flex items-center gap-2">
            {selectedModelInfo.tier === "premium" && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Premium</span>
            )}
            {selectedModelInfo.isReasoning && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Reasoning</span>
            )}
            {selectedModelInfo.requiresAuth && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Auth Required</span>
            )}
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showModelSelector && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 max-h-96 overflow-hidden animate-fade-in">
          {/* Search and Filter Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-medium placeholder:text-gray-400 text-gray-900"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setSelectedCompany(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${!selectedCompany ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {Object.entries(MODEL_COMPANIES).map(([key, company]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCompany(company.name)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    selectedCompany === company.name 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${company.color}`}></div>
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-64 overflow-y-auto">
            {Object.keys(groupedModels).length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No models found matching your search.
              </div>
            ) : (
              Object.entries(groupedModels).map(([key, company]) => (
                <div key={key} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3 bg-gray-50/50 text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${company.color}`}></div>
                    {company.name}
                  </div>
                  {company.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (model.available) {
                          if (model.requiresAuth && !loggedInUser) {
                            toast.error("Please sign in to access this model");
                          } else {
                            onModelSelect(model.id);
                          }
                        } else {
                          toast.info("This model is coming soon!");
                        }
                        setShowModelSelector(false);
                        setSearchQuery("");
                        setSelectedCompany(null);
                      }}
                      disabled={!model.available || (model.requiresAuth && !loggedInUser)}
                      className={`w-full text-left p-4 transition-all duration-200 ${
                        model.id === selectedModel
                          ? 'bg-indigo-50 border-l-4 border-indigo-500'
                          : model.available && (!model.requiresAuth || loggedInUser)
                          ? 'hover:bg-gray-50'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2 mb-1 text-gray-900">
                            {model.name}
                            {model.tier === "premium" && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Premium</span>
                            )}
                            {model.isReasoning && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Reasoning</span>
                            )}
                            {model.requiresAuth && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Auth Required</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 leading-relaxed">{model.description}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!model.available && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                              Coming Soon
                            </span>
                          )}
                          {model.requiresAuth && !loggedInUser && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                              Sign In Required
                            </span>
                          )}
                          {model.id === selectedModel && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { ALL_MODELS };
