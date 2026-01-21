import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineHome, MdDarkMode, MdLightMode } from "react-icons/md";
import SideDrawer from "./SideDrawer";

export default function Settings({ darkMode = false, setDarkMode = () => {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWatermark, setShowWatermark] = useState(() => {
    const stored = localStorage.getItem("showWatermark");
    return stored !== null ? JSON.parse(stored) : true; // Default: true (show watermark)
  });
  const [localDarkMode, setLocalDarkMode] = useState(darkMode);

  const navigate = useNavigate();

  // Handle watermark toggle
  const handleWatermarkToggle = (value) => {
    setShowWatermark(value);
    localStorage.setItem("showWatermark", JSON.stringify(value));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("watermarkChanged", { detail: { value } }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => setMenuOpen(true)}
          className="relative w-8 h-8 shrink-0 flex items-center justify-center text-gray-700"
          aria-label="Menu"
          title="Menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1 text-center truncate whitespace-nowrap">Settings</h1>
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-200 transition"
          title="Go to Home"
        >
          <MdOutlineHome size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4 max-w-2xl">
          {/* Watermark Setting */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Watermark</h3>
                  <p className="text-sm text-gray-600">
                    Display "created using CatShare" on all product images and previews
                  </p>
                </div>
                <button
                  onClick={() => handleWatermarkToggle(!showWatermark)}
                  className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ml-4 flex-shrink-0 ${
                    showWatermark ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      showWatermark ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Status:</span>{" "}
                  <span className={showWatermark ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {showWatermark ? "🟢 Enabled" : "🔴 Disabled"}
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {showWatermark
                    ? "Watermark will appear on all exported images and in previews"
                    : "Watermark is hidden on all content"}
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 About Watermark</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Watermark text: "created using CatShare"</li>
              <li>• Appears at the bottom center of images</li>
              <li>• Color adapts to background (dark text on light, white on dark)</li>
              <li>• Visible in product previews and exported images</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Side Drawer */}
      {menuOpen && (
        <SideDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          products={[]}
          imageMap={{}}
          setProducts={() => {}}
          setDeletedProducts={() => {}}
          selected={[]}
          onShowTutorial={() => {}}
          darkMode={false}
          setDarkMode={() => {}}
          isRendering={false}
          renderProgress={0}
          renderResult={null}
          setRenderResult={() => {}}
          handleRenderAllPNGs={() => {}}
        />
      )}
    </div>
  );
}
