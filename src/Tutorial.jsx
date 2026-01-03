import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Tutorial({ onClose }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Catalogue Manager 📦",
      description:
        "This app helps you manage your product catalogue with pricing for wholesale and resell channels. Learn how to create products, manage stock, and generate professional pricing displays!",
      icon: "👋",
    },
    {
      title: "What is This App? 🎯",
      description:
        "This is a product catalogue management tool for businesses that sell through multiple channels. You'll manage products, set different prices for wholesale and resell customers, control stock status (in/out), and generate professional images with pricing.",
      icon: "📊",
    },
    {
      title: "Creating Your First Product ✨",
      description:
        "Click the '+' button (bottom right) to create a new product. You'll set: Product name, subtitle, image, color scheme, packaging info, age group, wholesale price, resell price, categories, and stock status for each channel.",
      icon: "➕",
    },
    {
      title: "Product Images & Colors 🎨",
      description:
        "When creating a product, upload an image and crop it. The app suggests colors from your image for the background. You can customize the background color, text color, and image background separately to match your brand.",
      icon: "🖼️",
    },
    {
      title: "Pricing Structure 💰",
      description:
        "Each product has two pricing tiers: Wholesale (for bulk buyers) and Resell (for individual customers). You also set units like '/ piece', '/ dozen', 'per set' to show customers how products are sold.",
      icon: "💵",
    },
    {
      title: "Stock Status: In vs Out 📦",
      description:
        "For each product, you can mark it as 'In Stock' or 'Out of Stock' separately for wholesale and resell channels. This means you can sell wholesale only while resell is out of stock, or vice versa.",
      icon: "✅",
    },
    {
      title: "Managing Your Catalogue 📋",
      description:
        "Your main view shows all products. Click on a product to view/edit it. You can search by name, sort by name or category, and drag to reorder products. The buttons below each product toggle stock status.",
      icon: "🏪",
    },
    {
      title: "Wholesale vs Resell Tabs 🔀",
      description:
        "Switch between the 'Wholesale' and 'Resell' tabs to see your products with their respective pricing. This helps you preview how each pricing tier looks and verify stock availability for each channel.",
      icon: "🔄",
    },
    {
      title: "Bulk Editing 📝",
      description:
        "Need to update many products at once? Use Bulk Editor from the menu. Select which fields to change (price, stock, category, etc.), then edit all products together. Saves time when managing large catalogues!",
      icon: "✏️",
    },
    {
      title: "Rendering Product Images 🔁",
      description:
        "Use 'Render PNGs' to generate professional product images with all pricing, names, and details overlaid. Perfect for sharing with customers or using in presentations. The app processes all products in batch.",
      icon: "🎯",
    },
    {
      title: "Media Library 🖼️",
      description:
        "Upload and store all your product images in the Media Library. Organize images here before using them in products. You can upload, delete, and manage all your visual assets in one place.",
      icon: "📸",
    },
    {
      title: "Organizing with Categories 🏷️",
      description:
        "Create categories to organize your products (e.g., 'Toys', 'Clothes', 'Games'). You can assign multiple categories to a product. Use the Manage Categories option to add, edit, delete, or reorder categories.",
      icon: "🗂️",
    },
    {
      title: "The Shelf (Deleted Products) 🗑️",
      description:
        "When you delete a product, it goes to the Shelf instead of disappearing. From the Shelf view, you can restore deleted products back to your main catalogue or permanently delete them.",
      icon: "📦",
    },
    {
      title: "Backing Up Your Data 💾",
      description:
        "Use 'Backup & Restore' to create a ZIP file of your entire catalogue including all products and images. Keep regular backups to protect your work. You can restore from any backup anytime.",
      icon: "🛡️",
    },
    {
      title: "Typical Workflow 🔄",
      description:
        "1. Create products with images and pricing → 2. Organize with categories → 3. Switch to Wholesale/Resell to verify pricing → 4. Use Bulk Editor to make bulk updates → 5. Render PNGs for presentations → 6. Backup regularly",
      icon: "📈",
    },
    {
      title: "Pro Tips 💡",
      description:
        "• Create categories first, then assign them while creating products\n• Use consistent naming for easier searching\n• Check both Wholesale & Resell tabs to ensure pricing is correct\n• Render PNGs regularly for sharing with customers\n• Backup after making major changes",
      icon: "⭐",
    },
    {
      title: "You're Ready! 🎉",
      description:
        "You now understand how to manage your product catalogue! Start by creating your first product or uploading images to the Media Library. Have fun building your catalogue!",
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
