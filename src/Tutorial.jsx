import React, { useState, useEffect } from "react";
import { FiEdit, FiChevronDown } from "react-icons/fi";
import { MdInventory2 } from "react-icons/md";

export default function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wsStock, setWsStock] = useState(true);
  const [rsStock, setRsStock] = useState(false);
  const [dragItems, setDragItems] = useState(["Item 1", "Item 2", "Item 3"]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("wholesale");
  const [isProductControlsExpanded, setIsProductControlsExpanded] = useState(false);

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

  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (index) => {
    if (draggingIndex !== null && draggingIndex !== index) {
      const newItems = [...dragItems];
      const draggedItem = newItems[draggingIndex];
      newItems.splice(draggingIndex, 1);
      newItems.splice(index, 0, draggedItem);
      setDragItems(newItems);
      setDraggingIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const steps = [
    {
      title: "Welcome to CatShare 📦",
      description:
        "Learn about the key features that help you manage your product catalogue effectively.",
      icon: "👋",
      visualElements: null,
    },
    {
      title: "Create Products ✏️",
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
        </div>
      ),
    },
    {
      title: "Manage Products 🛠️",
      description:
        "In the Products tab, you can edit, move to shelf, reorder by dragging, and toggle WS/RS (Wholesale/Resell) In/Out stock status for each product.",
      icon: "📋",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <button
            onClick={() => setIsProductControlsExpanded(!isProductControlsExpanded)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-700 mb-2 hover:text-gray-900 transition"
          >
            <span>Product Controls:</span>
            <FiChevronDown
              className={`transition-transform flex-shrink-0 ${isProductControlsExpanded ? "rotate-180" : ""}`}
              size={18}
            />
          </button>
          {isProductControlsExpanded && (
            <div className="space-y-2">
              <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
                <FiEdit className="text-blue-600" size={16} />
                <span>Modify product details</span>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
                <MdInventory2 className="text-red-500 text-[18px]" />
                <span>Move to trash (can restore)</span>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWsStock(!wsStock)}
                    className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                      wsStock ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {wsStock ? "WS In" : "WS Out"}
                  </button>
                  <span className="text-xs text-gray-600">- Toggle wholesale stock availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRsStock(!rsStock)}
                    className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                      rsStock ? "bg-amber-500 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {rsStock ? "RS In" : "RS Out"}
                  </button>
                  <span className="text-xs text-gray-600">- Toggle resell stock availability</span>
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300 rounded">
                <div className="text-xs font-semibold text-gray-700 mb-2">Drag to reorder (try it!):</div>
                <div className="space-y-1">
                  {dragItems.map((item, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOver(index);
                      }}
                      onDragEnd={handleDragEnd}
                      onDragLeave={() => setDragOverIndex(null)}
                      className={`flex items-center gap-2 p-2 bg-gray-50 rounded cursor-move transition ${
                        draggingIndex === index ? "opacity-50 bg-blue-100" : ""
                      } ${dragOverIndex === index && draggingIndex !== index ? "border-t-2 border-blue-500" : ""}`}
                    >
                      <span className="text-gray-400 text-lg">☰</span>
                      <span className="text-xs text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tab Actions 🔍",
      description:
        "Use these action buttons available in both Wholesale and Resell tabs. Use the filter icon to show/hide by stock and category. Click info icon to see details. Use share to export product images.",
      icon: "🔀",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-sm font-semibold text-gray-700 mb-2">Wholesale Tab Features:</div>
          <div className="space-y-2">
            <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.5 16.5A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012 12z" />
              </svg>
              <span>Find products by name</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 10h12M10 15h4" />
              </svg>
              <span>Filter by stock & category</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Show product information</span>
            </div>
            <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
              <span>Export product images</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Wholesale vs Resell 🔀",
      description:
        "Toggle between Wholesale and Resell tabs to view products with different pricing models. Each tab shows the same products but with prices tailored for different customer types.",
      icon: "💰",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="flex gap-2 mb-4 min-w-0">
            <button
              onClick={() => setActiveTab("wholesale")}
              className={`flex-1 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold transition min-w-0 ${
                activeTab === "wholesale"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              Wholesale
            </button>
            <button
              onClick={() => setActiveTab("resell")}
              className={`flex-1 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold transition min-w-0 ${
                activeTab === "resell"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              Resell
            </button>
          </div>
          <div className="bg-white rounded border border-gray-300 p-3">
            {activeTab === "wholesale" ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Wholesale Tab Features:</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ View products with <span className="font-semibold">wholesale pricing</span></p>
                  <p>✓ Filter by stock status and categories</p>
                  <p>✓ Bulk operations for business sales</p>
                  <p>✓ Export product images for catalogs</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Resell Tab Features:</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ View products with <span className="font-semibold">retail pricing</span></p>
                  <p>✓ Filter by stock status and categories</p>
                  <p>✓ Show individual customer prices</p>
                  <p>✓ Export product images with retail prices</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Backup & Restore 💾",
      description:
        "Protect your catalogue data with Backup & Restore. Create ZIP file backups including all products and images, then restore them whenever needed.",
      icon: "🛡️",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="space-y-4">
            {/* Backup Section */}
            <div className="p-3 bg-white rounded-lg border-l-4 border-blue-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🛠️</span>
                <p className="font-semibold text-sm text-gray-800">Backup</p>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                <p>
                  <span className="font-medium">How it works:</span> Click "Backup & Restore" → Select "Backup" to create a complete backup of your entire catalogue.
                </p>
                <p>
                  <span className="font-medium">File format:</span> Saves as <code className="bg-gray-100 px-1 rounded text-[11px]">catalogue-backup-[timestamp].zip</code>
                </p>
                <p>
                  <span className="font-medium">Backup contents:</span>
                </p>
                <ul className="ml-3 space-y-1">
                  <li>✓ All product data (names, prices, details)</li>
                  <li>✓ All product images in images/ folder</li>
                  <li>✓ Deleted products list</li>
                </ul>
              </div>
            </div>

            {/* Restore Section */}
            <div className="p-3 bg-white rounded-lg border-l-4 border-green-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🛠️</span>
                <p className="font-semibold text-sm text-gray-800">Restore</p>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                <p>
                  <span className="font-medium">How it works:</span> Click "Backup & Restore" → Select "Restore" → Choose a backup ZIP file to recover your catalogue.
                </p>
                <p>
                  <span className="font-medium">What restores:</span>
                </p>
                <ul className="ml-3 space-y-1">
                  <li>✓ All products with original details</li>
                  <li>✓ All product images</li>
                  <li>✓ Categories and deleted products</li>
                </ul>
                <p className="text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                  💡 Restore replaces your current catalogue with the backed-up data.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Extra Features ⚙️",
      description:
        "Access additional tools from the side menu to manage deleted products, organize categories, and edit multiple products at once.",
      icon: "⚙️",
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-3">
          {/* Shelf Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <MdInventory2 className="text-red-500 text-[18px]" />
              <p className="font-semibold text-sm text-gray-800">Shelf</p>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <p>
                <span className="font-medium">What it is:</span> A recovery area for your deleted products.
              </p>
              <p>
                <span className="font-medium">What you can do:</span>
              </p>
              <ul className="ml-3 space-y-1">
                <li>✓ View all deleted products in one place</li>
                <li>✓ Restore any deleted product back to your catalogue</li>
                <li>✓ Permanently delete products if needed</li>
              </ul>
              <p className="text-blue-700 bg-blue-50 p-2 rounded mt-2">
                💡 Deletion is temporary - check Shelf before moving on!
              </p>
            </div>
          </div>

          {/* Manage Categories Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🗂️</span>
              <p className="font-semibold text-sm text-gray-800">Manage Categories</p>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <p>
                <span className="font-medium">What it is:</span> Organize products by creating custom categories.
              </p>
              <p>
                <span className="font-medium">What you can do:</span>
              </p>
              <ul className="ml-3 space-y-1">
                <li>✓ Create new categories for different product types</li>
                <li>✓ Assign products to multiple categories</li>
                <li>✓ Filter products by category in all tabs</li>
              </ul>
            </div>
          </div>

          {/* Bulk Editor Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✏️</span>
              <p className="font-semibold text-sm text-gray-800">Bulk Editor</p>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <p>
                <span className="font-medium">What it is:</span> Edit multiple products efficiently at once.
              </p>
              <p>
                <span className="font-medium">What you can do:</span>
              </p>
              <ul className="ml-3 space-y-1">
                <li>✓ Update pricing for many products together</li>
                <li>✓ Change categories in bulk</li>
                <li>✓ Modify other product details in bulk</li>
              </ul>
              <p className="text-green-700 bg-green-50 p-2 rounded mt-2">
                ⚡ Save time - update 50 products in seconds instead of one by one!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Forge Images ⭐",
      description:
        "Render images are required to share product images. After adding/editing products, renders happen automatically. But after Restore or Bulk Edit, you MUST manually render all images!",
      icon: "🎯",
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-orange-400 space-y-3">
          {/* How It Works */}
          <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
            <p className="font-semibold text-sm text-gray-800 mb-2">💾 What Render images Does:</p>
            <p className="text-xs text-gray-700 mb-2">
              Generates professional product images with pricing, names, and details overlaid on each product image.
            </p>
            <ul className="text-xs text-gray-700 space-y-1 ml-3">
              <li>✓ Product name overlaid on image</li>
              <li>✓ Pricing information included</li>
              <li>✓ Product details displayed</li>
              <li>✓ Shareable with customers</li>
            </ul>
          </div>

          {/* Auto Render Info */}
          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
            <p className="font-semibold text-sm text-gray-800 mb-2">✅ Auto-Render (Automatic):</p>
            <p className="text-xs text-gray-700">
              When you <span className="font-medium">Add or Edit</span> a single product, images render automatically.
            </p>
          </div>

          {/* Manual Render Required */}
          <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
            <p className="font-semibold text-sm text-gray-800 mb-2">⚠️ Manual Render Required:</p>
            <p className="text-xs text-gray-700 mb-2">
              You <span className="font-medium">MUST click Render images</span> from the side menu after:
            </p>
            <ul className="text-xs text-gray-700 space-y-1 ml-3">
              <li>🔄 Restoring from a backup</li>
              <li>📝 Using Bulk Editor to edit products</li>
            </ul>
            <p className="text-xs text-gray-700 mt-2">
              <span className="font-medium">Otherwise:</span> Non-rendered images cannot be shared, and you'd need to manually edit and save each product.
            </p>
          </div>

          {/* Bottom Note */}
          <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
            <p className="text-xs text-gray-700">
              💡 <span className="font-medium">Pro tip:</span> Always render images after bulk operations - it takes minutes to render everything at once instead of hours editing individually!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set! 🎉",
      description:
        "You now know all the main features. Start creating products, organizing them with categories, managing stock for different channels, and use Render images to create professional catalogs!",
      icon: "✨",
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
          <div className="text-center text-sm">
            <p className="font-semibold text-gray-800 mb-2">Quick Summary:</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              1️⃣ Create products with +button<br/>
              2️⃣ Manage stock with In/Out buttons<br/>
              3️⃣ View Wholesale & Resell pricing<br/>
              4️⃣ Use Render images for catalogs<br/>
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
