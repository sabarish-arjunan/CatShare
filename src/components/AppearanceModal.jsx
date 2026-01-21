import React from "react";
import { MdClose } from "react-icons/md";

export default function AppearanceModal({ isOpen, onClose, darkMode, setDarkMode }) {
  if (!isOpen) return null;

  const handleDarkModeToggle = (value) => {
    setDarkMode(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 animate-in slide-in-from-bottom-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Appearance</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Switch between light and dark theme
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-800">
              {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </span>
            <button
              onClick={() => handleDarkModeToggle(!darkMode)}
              className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ${
                darkMode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Status */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Current Theme:</span>{" "}
              <span className="font-medium">
                {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
