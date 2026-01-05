import React, { useState, useEffect } from "react";

export default function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Handle escape key to close tutorial
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const steps = [
    {
      title: "Welcome to Catalogue Manager 📦",
      description:
        "Learn about the key features that help you manage your product catalogue effectively.",
      icon: "👋",
      visualElements: null,
    },
    {
      title: "Add & Edit Products ✏️",
      description:
        "Click the blue '+' button at the bottom right to create a new product. Fill in name, pricing, categories, and upload an image. Click the edit icon on any product to modify it.",
      icon: "📝",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-3xl">
              ➕
            </div>
            <p className="text-xs text-gray-600 mt-2">Blue '+' button to create product</p>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 p-2 bg-white border border-gray-300 rounded text-center text-sm">
              ✏️ Edit Icon
            </div>
            <div className="flex-1 p-2 bg-white border border-gray-300 rounded text-center text-sm">
              🗑️ Delete Icon
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Products Tab - Manage & Organize 🛠️",
      description:
        "In the Products tab, you can edit, move to shelf, reorder by dragging, and toggle WS/RS (Wholesale/Resell) In/Out stock status for each product.",
      icon: "📋",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-sm font-semibold text-gray-700 mb-2">Product Controls:</div>
          <div className="space-y-2">
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">Edit (✏️)</span> - Modify product details
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">Shelf (📦)</span> - Move to trash (can restore)
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded">
              <div className="text-xs font-semibold text-gray-700 mb-2">Stock Status Toggles:</div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <button className="text-xs font-semibold px-2 py-1 rounded bg-green-600 text-white">WS In</button>
                  <button className="text-xs font-semibold px-2 py-1 rounded bg-gray-300 text-gray-700">WS Out</button>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <button className="text-xs font-semibold px-2 py-1 rounded bg-amber-500 text-white">RS In</button>
                  <button className="text-xs font-semibold px-2 py-1 rounded bg-gray-300 text-gray-700">RS Out</button>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">Drag</span> - Reorder products
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Wholesale Tab - Filter, Info & Share 🏢",
      description:
        "Switch to Wholesale tab to see your products with wholesale pricing. Use the filter icon to show/hide by stock and category. Click info icon to see details. Use share to export.",
      icon: "🔀",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-sm font-semibold text-gray-700 mb-2">Wholesale Tab Features:</div>
          <div className="space-y-2">
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">🔍 Search</span> - Find products by name
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">🔗 Filter</span> - Filter by stock & category
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">ℹ️ Info</span> - Show product information
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs">
              <span className="font-semibold">📤 Share</span> - Export product images
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Resell Tab - Same Features, Different Pricing 🛍️",
      description:
        "Switch to Resell tab to see products with retail pricing. Same filter, info, and share features as Wholesale tab. Great for showing individual customers different prices.",
      icon: "💰",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-white border-2 border-blue-500 rounded text-sm font-semibold text-blue-600">
              Wholesale Tab
            </div>
            <div className="my-2 text-xl">⬌</div>
            <div className="inline-block px-4 py-2 bg-white border-2 border-blue-500 rounded text-sm font-semibold text-blue-600">
              Resell Tab
            </div>
            <p className="text-xs text-gray-600 mt-3">Same products, different pricing!</p>
          </div>
        </div>
      ),
    },
    {
      title: "Side Menu - Backup & Restore 💾",
      description:
        "Click the menu icon to open the side menu. Use 'Backup & Restore' to create ZIP backups of your entire catalogue including all images. Restore anytime!",
      icon: "🛡️",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-sm font-semibold text-gray-700 mb-2">Menu Options:</div>
          <div className="space-y-1 text-xs">
            <div className="p-2 bg-white border border-gray-300 rounded">
              🛠️ <span className="font-semibold">Backup & Restore</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded">
              📦 <span className="font-semibold">Shelf</span> (Deleted Products)
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded">
              🗂️ <span className="font-semibold">Manage Categories</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded">
              ✏️ <span className="font-semibold">Bulk Editor</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded">
              🔁 <span className="font-semibold">Render PNGs</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Shelf, Categories & Bulk Editor ⚙️",
      description:
        "From the side menu:\n• Shelf: View deleted products and restore them\n• Manage Categories: Create and organize product categories\n• Bulk Editor: Edit multiple products at once for efficient updates",
      icon: "🗂️",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="space-y-2">
            <div className="p-3 bg-white border-l-4 border-blue-600 rounded">
              <p className="font-semibold text-sm">📦 Shelf</p>
              <p className="text-xs text-gray-600">Recover deleted products</p>
            </div>
            <div className="p-3 bg-white border-l-4 border-blue-600 rounded">
              <p className="font-semibold text-sm">🏷️ Manage Categories</p>
              <p className="text-xs text-gray-600">Organize products</p>
            </div>
            <div className="p-3 bg-white border-l-4 border-blue-600 rounded">
              <p className="font-semibold text-sm">⚡ Bulk Editor</p>
              <p className="text-xs text-gray-600">Update many at once</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Render PNGs - Most Important Feature ⭐",
      description:
        "Click 'Render PNGs' from the side menu to automatically generate professional product images with pricing, names, and details overlaid. Perfect for sharing with customers and creating presentations!",
      icon: "🎯",
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-orange-400">
          <div className="text-center">
            <div className="text-3xl mb-2">🔁</div>
            <p className="font-bold text-sm text-gray-800">Render PNGs</p>
            <p className="text-xs text-gray-600 mt-2">Generate professional product images with pricing automatically!</p>
            <div className="mt-3 p-2 bg-white rounded text-xs text-gray-700">
              ✓ Add product details overlaid on image<br/>
              ✓ Include pricing information<br/>
              ✓ Process all products at once<br/>
              ✓ Perfect for catalogs & presentations
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set! 🎉",
      description:
        "You now know all the main features. Start creating products, organizing them with categories, managing stock for different channels, and use Render PNGs to create professional catalogs!",
      icon: "✨",
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
          <div className="text-center text-sm">
            <p className="font-semibold text-gray-800 mb-2">Quick Summary:</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              1️⃣ Create products with +button<br/>
              2️⃣ Manage stock with In/Out buttons<br/>
              3️⃣ View Wholesale & Resell pricing<br/>
              4️⃣ Use Render PNGs for catalogs<br/>
              5️⃣ Backup your data regularly
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500 transition"
        >
          ✕
        </button>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step icon and title */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {step.description}
          </p>
        </div>

        {/* Visual elements */}
        {step.visualElements && (
          <div className="mb-4">
            {step.visualElements}
          </div>
        )}

        {/* Step counter */}
        <div className="text-center text-xs text-gray-400 mb-6">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
              currentStep === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            Back
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm"
          >
            Exit
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
          >
            {currentStep === steps.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
