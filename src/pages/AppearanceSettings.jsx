import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

export default function AppearanceSettings({ darkMode = false, setDarkMode = (value) => {} }) {
  const navigate = useNavigate();
  const [localDarkMode, setLocalDarkMode] = useState(darkMode);

  useEffect(() => {
    setLocalDarkMode(darkMode);
  }, [darkMode]);

  const handleDarkModeToggle = (value) => {
    setLocalDarkMode(value);
    setDarkMode(value);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 dark:from-slate-900 dark:to-slate-800 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header with smooth backdrop */}
      <header className="sticky top-[40px] z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 h-14 flex items-center gap-3 px-4 relative shadow-sm">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center text-gray-900 dark:text-white">Appearance</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-slate-400 text-sm font-medium">
            Switch between light and dark theme
          </p>

          {/* Main Toggle Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-lg p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-2xl mb-2">
                  {localDarkMode ? "🌙" : "☀️"}
                </div>
                <span className="text-base font-semibold text-gray-900 dark:text-white block">
                  {localDarkMode ? "Dark Mode" : "Light Mode"}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {localDarkMode ? "Enabled" : "Active"}
                </span>
              </div>

              {/* Enhanced Toggle Switch */}
              <button
                onClick={() => handleDarkModeToggle(!localDarkMode)}
                className={`relative inline-flex h-12 w-20 items-center rounded-full transition-all duration-300 flex-shrink-0 ${
                  localDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30"
                    : "bg-gradient-to-r from-gray-300 to-gray-400 shadow-sm"
                } hover:shadow-lg`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center text-lg ${
                    localDarkMode ? "translate-x-10" : "translate-x-1"
                  }`}
                >
                  {localDarkMode ? "🌙" : "☀️"}
                </span>
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className={`p-4 rounded-xl border shadow-sm transition-colors ${
            localDarkMode
              ? "bg-indigo-900/20 border-indigo-700/30 dark:bg-indigo-900/30 dark:border-indigo-600/40"
              : "bg-blue-50 border-blue-200"
          }`}>
            <p className={`text-xs font-semibold ${
              localDarkMode ? "text-indigo-300 dark:text-indigo-300" : "text-blue-900"
            }`}>
              Current Theme: <span className="font-bold">{localDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            </p>
            <p className={`text-xs mt-2 leading-relaxed ${
              localDarkMode ? "text-indigo-200 dark:text-indigo-200" : "text-blue-800"
            }`}>
              {localDarkMode
                ? "Darker colors reduce eye strain in low-light environments and improve battery life on OLED screens."
                : "Bright colors optimize readability and are better suited for well-lit environments."}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Auto-Save</h3>
              <p className="text-xs text-gray-600 dark:text-slate-400">Saved automatically</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Smooth Transition</h3>
              <p className="text-xs text-gray-600 dark:text-slate-400">Instant application</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">🔋</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Battery Friendly</h3>
              <p className="text-xs text-gray-600 dark:text-slate-400">OLED optimization</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">👁️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Eye Comfort</h3>
              <p className="text-xs text-gray-600 dark:text-slate-400">Reduced eye strain</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-5 border border-gray-200 dark:border-slate-600">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <span>ℹ️</span> Theme Information
            </h3>
            <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                Your preference is saved automatically to your device
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                Changes apply instantly across the entire app
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                Dark mode reduces battery consumption on OLED displays
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                All components smoothly transition between themes
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
