import React, { useState } from "react";

export default function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Catalogue Manager 📦",
      description:
        "Learn about the key features that help you manage your product catalogue effectively.",
      icon: "👋",
    },
    {
      title: "Add & Edit Products ✏️",
      description:
        "Click the '+' button at the bottom right to create a new product. Fill in name, pricing, categories, and upload an image. To edit an existing product, click the edit icon on any product card.",
      icon: "📝",
    },
    {
      title: "Products Tab - Edit & Manage 🛠️",
      description:
        "In the Products tab, you can:\n• Edit: Click the edit icon to modify product details\n• Shelf: Click to move a product to trash (can be restored later)\n• Reorder: Drag products to arrange them\n• WS/RS In/Out: Toggle wholesale and resell stock status",
      icon: "📋",
    },
    {
      title: "Wholesale & Resell Tabs - Filter & Share 🏪",
      description:
        "Switch between Wholesale and Resell tabs to see products with different pricing:\n• Filter: Use the filter icon to show/hide by stock status and category\n• Show Info: Click the info icon to see product details\n• Share: Click share to export product images and information",
      icon: "🔀",
    },
    {
      title: "Side Menu - Backup & Restore 💾",
      description:
        "Click the menu icon to access:\n• Backup & Restore: Create ZIP backups of your entire catalogue including all images. Restore anytime to recover your data.",
      icon: "🛡️",
    },
    {
      title: "Shelf, Categories & Bulk Editor 🗂️",
      description:
        "From the side menu:\n• Shelf: View deleted products and restore them or permanently delete\n• Manage Categories: Create and organize product categories\n• Bulk Editor: Edit multiple products at once - change prices, stock, categories in bulk",
      icon: "⚙️",
    },
    {
      title: "Render PNGs - Most Important Feature ⭐",
      description:
        "Click 'Render PNGs' from the side menu to automatically generate professional product images with pricing, names, and details overlaid. Perfect for sharing catalogs with customers, creating presentations, and bulk exports. This is a powerful feature that saves hours of manual work!",
      icon: "🎯",
    },
    {
      title: "You're All Set! 🎉",
      description:
        "You now know all the main features. Start creating products, organizing them, and use Render PNGs to generate professional images for your customers!",
      icon: "✨",
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
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
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {step.description}
          </p>
        </div>

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
