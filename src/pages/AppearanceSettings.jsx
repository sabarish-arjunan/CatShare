import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdOutlineHome } from "react-icons/md";

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
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-950 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center dark:text-white">Appearance</h1>
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Go to Home"
        >
          <MdOutlineHome size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Switch between light and dark theme
          </p>

          {/* Toggle Card */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium dark:text-white">
                  {localDarkMode ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
              <button
                onClick={() => handleDarkModeToggle(!localDarkMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                  localDarkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                    localDarkMode ? "translate-x-7" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Current:</span> {localDarkMode ? "Dark Mode" : "Light Mode"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {localDarkMode
                ? "Dark mode helps reduce eye strain in low-light environments"
                : "Light mode is optimized for bright environments"}
            </p>
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">About</h3>
            <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1">
              <li>• Preference is saved automatically</li>
              <li>• Changes apply instantly</li>
              <li>• Dark mode reduces battery usage</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
