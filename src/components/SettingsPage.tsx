import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ALL_MODELS } from "./ModelSelector";

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userSettings = useQuery(api.settings.getUserSettings);
  const updateUserSettings = useMutation(api.settings.updateUserSettings);
  
  // Local state for settings
  const [settings, setSettings] = useState({
    defaultModel: "google/gemini-2.0-flash-lite-001",
    theme: "light",
    fontSize: "medium",
    showThinkingByDefault: false,
    autoSaveChats: true,
    enableNotifications: true,
    language: "en",
    maxTokens: 1000,
    temperature: 0.7,
  });

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Load user settings when available
  useEffect(() => {
    if (userSettings) {
      setSettings(prev => ({ ...prev, ...userSettings }));
    }
  }, [userSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings({ settings });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "models", name: "AI Models", icon: "🤖" },
    { id: "appearance", name: "Appearance", icon: "🎨" },
    { id: "privacy", name: "Privacy", icon: "🔒" },
    { id: "account", name: "Account", icon: "👤" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-600">Customize your VibeChat experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-indigo-100 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleSettingChange("language", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="zh">中文</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Auto-save chats
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Automatically save your conversations
                          </p>
                        </div>
                        <button
                          onClick={() => handleSettingChange("autoSaveChats", !settings.autoSaveChats)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.autoSaveChats ? "bg-indigo-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.autoSaveChats ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Enable notifications
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Get notified about important updates
                          </p>
                        </div>
                        <button
                          onClick={() => handleSettingChange("enableNotifications", !settings.enableNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.enableNotifications ? "bg-indigo-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.enableNotifications ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "models" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Model
                        </label>
                        <select
                          value={settings.defaultModel}
                          onChange={(e) => handleSettingChange("defaultModel", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          {ALL_MODELS.filter(model => model.available && (!model.requiresAuth || loggedInUser)).map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.company})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Tokens: {settings.maxTokens}
                        </label>
                        <input
                          type="range"
                          min="100"
                          max="4000"
                          step="100"
                          value={settings.maxTokens}
                          onChange={(e) => handleSettingChange("maxTokens", parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>100</span>
                          <span>4000</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperature: {settings.temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={settings.temperature}
                          onChange={(e) => handleSettingChange("temperature", parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0 (Focused)</span>
                          <span>2 (Creative)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Show reasoning by default
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Automatically expand chain-of-thought for reasoning models
                          </p>
                        </div>
                        <button
                          onClick={() => handleSettingChange("showThinkingByDefault", !settings.showThinkingByDefault)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.showThinkingByDefault ? "bg-indigo-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.showThinkingByDefault ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Theme
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {["light", "dark", "auto"].map((theme) => (
                            <button
                              key={theme}
                              onClick={() => handleSettingChange("theme", theme)}
                              className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                                settings.theme === theme
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="text-2xl mb-2">
                                {theme === "light" && "☀️"}
                                {theme === "dark" && "🌙"}
                                {theme === "auto" && "🔄"}
                              </div>
                              <div className="text-sm font-medium capitalize">{theme}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {["small", "medium", "large"].map((size) => (
                            <button
                              key={size}
                              onClick={() => handleSettingChange("fontSize", size)}
                              className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                                settings.fontSize === size
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className={`font-medium mb-1 ${
                                size === "small" ? "text-sm" : 
                                size === "medium" ? "text-base" : "text-lg"
                              }`}>
                                Aa
                              </div>
                              <div className="text-xs capitalize">{size}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Data</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Data Usage</h4>
                            <p className="text-sm text-blue-700">
                              Your conversations are stored securely and used only to provide the service. 
                              We don't share your data with third parties.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button className="w-full p-4 border border-red-200 rounded-xl text-left hover:bg-red-50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-red-900 group-hover:text-red-700">
                                Delete All Chat History
                              </h4>
                              <p className="text-sm text-red-600 mt-1">
                                Permanently delete all your conversations
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                        </button>

                        <button className="w-full p-4 border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Export Data
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Download a copy of your data
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    
                    {loggedInUser ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {loggedInUser.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{loggedInUser.email}</h4>
                              <p className="text-sm text-gray-600">
                                Member since {new Date(loggedInUser._creationTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button className="w-full p-4 border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Change Password</h4>
                                <p className="text-sm text-gray-600 mt-1">Update your account password</p>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>

                          <button className="w-full p-4 border border-red-200 rounded-xl text-left hover:bg-red-50 transition-colors group">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-red-900 group-hover:text-red-700">
                                  Delete Account
                                </h4>
                                <p className="text-sm text-red-600 mt-1">
                                  Permanently delete your account and all data
                                </p>
                              </div>
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Not signed in</h4>
                        <p className="text-gray-600 mb-4">Sign in to access account settings and save your preferences</p>
                        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Changes are saved automatically
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
