import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

export default function ThemesSettings() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "classic";
  });

  // List of available themes
  const themes = [
    {
      id: "classic",
      name: "Classic",
      description: "The default product card layout. Clean and minimalist design.",
      isDefault: true,
      status: "Active",
    },
    // More themes will be added in the future
  ];

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem("selectedTheme", themeId);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: themeId } }));
  };

  const getThemeDetails = (themeId) => {
    return themes.find((theme) => theme.id === themeId);
  };

  const selectedThemeDetails = getThemeDetails(selectedTheme);

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
        <h1 className="text-xl font-bold flex-1 text-center dark:text-white">Themes</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose how your product cards are displayed
          </p>

          {/* Themes List */}
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedTheme === theme.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold dark:text-white">{theme.name}</h3>
                      {theme.isDefault && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{theme.description}</p>
                  </div>

                  {/* Radio Button */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        selectedTheme === theme.id
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selectedTheme === theme.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Current Selection Info */}
          {selectedThemeDetails && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
                Current Theme: {selectedThemeDetails.name}
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {selectedThemeDetails.description}
              </p>
            </div>
          )}

          {/* Coming Soon Info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">
              More Themes Coming Soon
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We're working on additional product card layouts to give you more customization options for your product displays.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
