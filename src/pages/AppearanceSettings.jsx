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
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-md transition"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">Appearance</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl">
          <p className="text-gray-600 text-sm">
            Switch between light and dark theme
          </p>

          {/* Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {localDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
              <button
                onClick={() => handleDarkModeToggle(!localDarkMode)}
                className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ${
                  localDarkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                    localDarkMode ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Current Theme:</span>{" "}
              <span className="font-medium">
                {localDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
            </p>
            <p className="text-xs text-blue-800 mt-2">
              {localDarkMode
                ? "Dark mode helps reduce eye strain in low-light environments"
                : "Light mode is optimized for bright environments and reading"}
            </p>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">About Appearance</h3>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Your preference is saved automatically</li>
              <li>• Changes apply across the entire app</li>
              <li>• Dark mode reduces battery usage on OLED displays</li>
              <li>• Appearance setting syncs with your system preference</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
