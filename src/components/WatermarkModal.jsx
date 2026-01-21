import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";

export default function WatermarkModal({ isOpen, onClose, showWatermark, setShowWatermark, watermarkText, setWatermarkText }) {
  const [editingWatermarkText, setEditingWatermarkText] = useState(watermarkText);

  useEffect(() => {
    setEditingWatermarkText(watermarkText);
  }, [watermarkText]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Watermark</h2>
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
            Display custom text on all product images and previews
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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

          {/* Status */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-800 mb-2">Watermark Text</label>
              <input
                type="text"
                value={editingWatermarkText}
                onChange={(e) => setEditingWatermarkText(e.target.value)}
                placeholder="Enter watermark text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Current: <span className="font-mono">{watermarkText}</span>
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveWatermarkText}
                  disabled={editingWatermarkText.trim() === ""}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Save
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
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
      </div>
    </div>
  );
}
