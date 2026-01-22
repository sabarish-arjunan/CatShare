import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import { MdCircle } from "react-icons/md";

export default function WatermarkSettings() {
  const navigate = useNavigate();
  const [showWatermark, setShowWatermark] = useState(() => {
    const stored = localStorage.getItem("showWatermark");
    return stored !== null ? JSON.parse(stored) : false;
  });
  const [watermarkText, setWatermarkText] = useState(() => {
    const stored = localStorage.getItem("watermarkText");
    return stored || "Created using CatShare";
  });
  const [editingWatermarkText, setEditingWatermarkText] = useState(watermarkText);
  const [watermarkPosition, setWatermarkPosition] = useState(() => {
    const stored = localStorage.getItem("watermarkPosition");
    return stored || "bottom-center"; // Default position
  });

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
    const defaultText = "Created using CatShare";
    setWatermarkText(defaultText);
    setEditingWatermarkText(defaultText);
    localStorage.setItem("watermarkText", defaultText);
    window.dispatchEvent(new CustomEvent("watermarkTextChanged", { detail: { text: defaultText } }));
  };

  const handlePositionChange = (position) => {
    setWatermarkPosition(position);
    localStorage.setItem("watermarkPosition", position);
    window.dispatchEvent(new CustomEvent("watermarkPositionChanged", { detail: { position } }));
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
        <div className="space-y-4 max-w-2xl">
          <p className="text-gray-600 text-sm">
            Display custom text on all product images and previews
          </p>

          {/* Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <MdCircle size={12} className={showWatermark ? "text-green-500" : "text-red-500"} />
                {showWatermark ? "Enabled" : "Disabled"}
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
              <span className={`${showWatermark ? "text-green-600 font-medium" : "text-red-600 font-medium"} flex items-center gap-1.5 inline-flex`}>
                <MdCircle size={10} className={showWatermark ? "text-green-500" : "text-red-500"} />
                {showWatermark ? "Enabled" : "Disabled"}
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
            <>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-800 mb-2">Watermark Text</label>
                <input
                  type="text"
                  value={editingWatermarkText}
                  onChange={(e) => setEditingWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm mb-2"
                />
                <p className="text-xs text-gray-500 mb-3">
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

              {/* Watermark Position Selector */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-800 mb-3">Position</label>
                <p className="text-xs text-gray-600 mb-3">Click on the position buttons on the image preview</p>

                {/* Position Preview Image with Buttons */}
                <div className="relative mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 mb-3" style={{ aspectRatio: "1/1", maxWidth: "280px", width: "100%" }}>
                  {/* Sample product image preview */}
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F9de8f88039f043c2bb2e12760a839fad%2F7f2e888f655c4a6d8e8d286a6b93b85a?format=webp&width=800&height=1200"
                    alt="Sample product"
                    className="w-full h-full object-cover"
                    style={{ transform: "scale(1.05)" }}
                  />

                  {/* Watermark Text Preview at Selected Position */}
                  <div
                    style={{
                      position: "absolute",
                      fontSize: "10px",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: 500,
                      letterSpacing: "0.5px",
                      color: "rgba(51, 51, 51, 0.85)",
                      textShadow: "none",
                      pointerEvents: "none",
                      zIndex: 3,
                      ...(watermarkPosition === "top-left" && { top: 8, left: 8, transform: "none" }),
                      ...(watermarkPosition === "top-center" && { top: 8, left: "50%", transform: "translateX(-50%)" }),
                      ...(watermarkPosition === "top-right" && { top: 8, right: 8, left: "auto", transform: "none" }),
                      ...(watermarkPosition === "middle-left" && { top: "50%", left: 8, transform: "translateY(-50%)" }),
                      ...(watermarkPosition === "middle-center" && { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }),
                      ...(watermarkPosition === "middle-right" && { top: "50%", right: 8, left: "auto", transform: "translateY(-50%)" }),
                      ...(watermarkPosition === "bottom-left" && { bottom: 8, left: 8, transform: "none" }),
                      ...(watermarkPosition === "bottom-center" && { bottom: 8, left: "50%", transform: "translateX(-50%)" }),
                      ...(watermarkPosition === "bottom-right" && { bottom: 8, right: 8, left: "auto", transform: "none" }),
                    }}
                  >
                    {watermarkText}
                  </div>

                  {/* Top Left Position Button */}
                  <button
                    onClick={() => handlePositionChange("top-left")}
                    className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "top-left"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Top Left"
                  >
                    ↖
                  </button>

                  {/* Top Center Position Button */}
                  <button
                    onClick={() => handlePositionChange("top-center")}
                    className={`absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "top-center"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Top Center"
                  >
                    ⬆
                  </button>

                  {/* Top Right Position Button */}
                  <button
                    onClick={() => handlePositionChange("top-right")}
                    className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "top-right"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Top Right"
                  >
                    ↗
                  </button>

                  {/* Middle Left Position Button */}
                  <button
                    onClick={() => handlePositionChange("middle-left")}
                    className={`absolute top-1/2 -translate-y-1/2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "middle-left"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Middle Left"
                  >
                    ⬅
                  </button>

                  {/* Middle Center Position Button */}
                  <button
                    onClick={() => handlePositionChange("middle-center")}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "middle-center"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Middle Center"
                  >
                    ●
                  </button>

                  {/* Middle Right Position Button */}
                  <button
                    onClick={() => handlePositionChange("middle-right")}
                    className={`absolute top-1/2 -translate-y-1/2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "middle-right"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Middle Right"
                  >
                    ➡
                  </button>

                  {/* Bottom Left Position Button */}
                  <button
                    onClick={() => handlePositionChange("bottom-left")}
                    className={`absolute bottom-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "bottom-left"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Bottom Left"
                  >
                    ↙
                  </button>

                  {/* Bottom Center Position Button */}
                  <button
                    onClick={() => handlePositionChange("bottom-center")}
                    className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "bottom-center"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Bottom Center"
                  >
                    ⬇
                  </button>

                  {/* Bottom Right Position Button */}
                  <button
                    onClick={() => handlePositionChange("bottom-right")}
                    className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      watermarkPosition === "bottom-right"
                        ? "hidden"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                    title="Bottom Right"
                  >
                    ↘
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Current: <span className="font-medium capitalize">{watermarkPosition.replace("-", " ")}</span>
                </p>
              </div>
            </>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 About Watermark</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Default text: "Created using CatShare"</li>
              <li>• Fully customizable text and position</li>
              <li>• 9 position options to choose from</li>
              <li>• Color adapts to background (dark text on light, white on dark)</li>
              <li>• Visible in product previews and exported images</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
