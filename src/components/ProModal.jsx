import React from "react";
import { MdClose, MdStar } from "react-icons/md";

export default function ProModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const proFeatures = [
    { name: "Bulk Editor", description: "Edit multiple products at once with batch operations" },
    { name: "Watermark Customization", description: "Change watermark text and customize it for your brand" },
    { name: "Manage Categories", description: "Create, edit, and organize unlimited product categories" },
    { name: "Stock Control", description: "Toggle wholesale and resell stock IN/OUT status" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <MdStar className="text-yellow-500 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">CatShare Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900 mb-1">
              <span className="font-semibold">Current Plan:</span> Free - Fully Featured
            </p>
            <p className="text-xs text-green-800">
              You have access to all core features at no cost. Pro features coming soon!
            </p>
          </div>

          {/* Coming Soon Notice */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">✨ What's Coming</p>
            <p className="text-xs text-blue-800">
              CatShare Pro will unlock powerful features for efficient product management. Currently, all features are free while we prepare the Pro version.
            </p>
          </div>

          {/* Pro Features */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdStar className="text-yellow-500" />
              Features Coming in Pro Version
            </h3>
            <div className="space-y-2">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-800">{feature.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Why Upgrade to Pro?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Edit bulk products at once to save time</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Full control over watermark and branding</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Unlimited categories for organizing products</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Advanced inventory management with stock control</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
            <p className="text-sm font-semibold mb-2">Stay Updated</p>
            <p className="text-xs mb-3 opacity-90">
              We'll notify you when CatShare Pro launches. Your free account will always work!
            </p>
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition font-medium"
            >
              Got it!
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center">
            Free forever. Pro features coming in 2025.
          </p>
        </div>
      </div>
    </div>
  );
}
