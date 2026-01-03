import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Tutorial({ onClose }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to the App Tutorial",
      description:
        "This tutorial will guide you through all the main features of the Catalogue App. Click 'Next' to begin!",
      icon: "👋",
      action: null,
    },
    {
      title: "Shelf - View Your Products",
      description:
        "The Shelf is where you can see all your products in a grid view. You can add new products, edit existing ones, and manage your inventory here.",
      icon: "📦",
      action: () => {
        navigate("/shelf");
      },
    },
    {
      title: "Manage Categories",
      description:
        "Organize your products by creating and managing categories. You can add, edit, delete, and reorder categories using drag-and-drop.",
      icon: "🗂️",
      action: null,
    },
    {
      title: "Media Library",
      description:
        "Upload and manage images for your products. The Media Library stores all your assets in one place for easy access.",
      icon: "🖼️",
      action: null,
    },
    {
      title: "Bulk Editor",
      description:
        "Edit multiple products at once to save time. Update pricing, descriptions, and other details for many products simultaneously.",
      icon: "✏️",
      action: null,
    },
    {
      title: "Retail View",
      description:
        "See how your products appear with retail pricing. This view helps you visualize the final pricing display for your customers.",
      icon: "🛍️",
      action: () => {
        navigate("/retail");
      },
    },
    {
      title: "Render PNGs",
      description:
        "Render all your product images as PNGs with all the pricing and details. This batch processing feature saves time for large catalogs.",
      icon: "🔁",
      action: null,
    },
    {
      title: "Backup & Restore",
      description:
        "Backup your entire catalogue including all products and images as a ZIP file. You can restore from a backup anytime to recover your data.",
      icon: "🛠️",
      action: null,
    },
    {
      title: "Tutorial Complete! 🎉",
      description:
        "You're all set! You now know all the main features. Explore the app and happy cataloguing!",
      icon: "✨",
      action: null,
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500 transition"
        >
          &times;
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
          <p className="text-gray-600 text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step counter */}
        <div className="text-center text-xs text-gray-400 mb-6">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              currentStep === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            Previous
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {currentStep === steps.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
