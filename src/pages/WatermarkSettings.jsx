import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

export default function WatermarkSettings() {
  const navigate = useNavigate();
  const [showWatermark, setShowWatermark] = useState(() => {
    const stored = localStorage.getItem("showWatermark");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [watermarkText, setWatermarkText] = useState(() => {
    const stored = localStorage.getItem("watermarkText");
    return stored || "created using CatShare";
  });
  const [editingWatermarkText, setEditingWatermarkText] = useState(watermarkText);

  useEffect(() => {
    setEditingWatermarkText(watermarkText);
  }, [watermarkText]);

  const handleWatermarkToggle = (value) => {
    setShowWatermark(value);
    localStorage.setItem("showWatermark", JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("watermarkChanged", { detail: { value } }));
  };

  const handleSaveWatermarkText = () => {
    const trimmedText = editingWatermarkText.trim();
    if (trimmedText.length === 0) {
      setEditingWatermarkText(watermarkText);
      return;
    }
    setWatermarkText(trimmedText);
    localStorage.setItem("watermarkText", trimmedText);
    window.dispatchEvent(new CustomEvent("watermarkTextChanged", { detail: { text: trimmedText } }));
  };

  const handleResetWatermarkText = () => {
    const defaultText = "created using CatShare";
    setWatermarkText(defaultText);
    setEditingWatermarkText(defaultText);
    localStorage.setItem("watermarkText", defaultText);
    window.dispatchEvent(new CustomEvent("watermarkTextChanged", { detail: { text: defaultText } }));
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
        <h1 className="text-xl font-bold flex-1 text-center">Watermark</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl">
          <p className="text-gray-600 text-sm">
            Display custom text on all product images and previews
          </p>

          {/* Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {showWatermark ? "🟢 Enabled" : "🔴 Disabled"}
              </span>
              <button
                onClick={() => handleWatermarkToggle(!showWatermark)}
                className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ${
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
          </div>

          {/* Status */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Status:</span>{" "}
              <span className={showWatermark ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {showWatermark ? "🟢 Enabled" : "🔴 Disabled"}
              </span>
            </p>
            <p className="text-xs text-blue-800 mt-2">
              {showWatermark
                ? "Watermark will appear on all exported images and in previews"
                : "Watermark is hidden on all content"}
            </p>
          </div>

          {/* Watermark Text Editor - Only visible when enabled */}
          {showWatermark && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-800 mb-3">Watermark Text</label>
              <input
                type="text"
                value={editingWatermarkText}
                onChange={(e) => setEditingWatermarkText(e.target.value)}
                placeholder="Enter watermark text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm mb-3"
              />
              <p className="text-xs text-gray-500 mb-4">
                Current: <span className="font-mono">{watermarkText}</span>
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWatermarkText}
                  disabled={editingWatermarkText.trim() === ""}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleResetWatermarkText}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 About Watermark</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Default text: "created using CatShare"</li>
              <li>• Fully customizable when enabled</li>
              <li>• Appears at the bottom center of images</li>
              <li>• Color adapts to background (dark text on light, white on dark)</li>
              <li>• Visible in product previews and exported images</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
