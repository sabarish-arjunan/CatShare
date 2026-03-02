import React, { useState, useEffect } from "react";
import { FiEdit, FiChevronDown, FiPlus } from "react-icons/fi";
import { MdInventory2 } from "react-icons/md";
import { RiShoppingBag3Line, RiAddCircleLine, RiLayout4Line, RiSearchLine, RiExchangeDollarLine, RiShieldLine, RiSettings4Line, RiImage2Line, RiCheckDoubleLine } from "react-icons/ri";

const tutorialStyles = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .fade-out-hint {
    animation: fadeOut 0.6s ease-out forwards;
  }

  @keyframes colorPulse {
    0%, 100% { color: rgb(107, 114, 128); }
    50% { color: rgb(31, 41, 55); }
  }

  .pulse-chevron {
    animation: colorPulse 1s ease-in-out infinite;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes iconFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes progressGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
  }

  @keyframes pulseScale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .modal-content {
    animation: slideInUp 0.4s ease-out;
  }

  .tutorial-icon {
    animation: scaleIn 0.5s ease-out;
  }

  .floating-icon {
    animation: iconFloat 3s ease-in-out infinite;
  }

  .progress-bar-active {
    animation: progressGlow 2s ease-in-out infinite;
  }

  .step-badge {
    animation: pulseScale 2s ease-in-out infinite;
  }

  .button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  }
`;

export default function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [catalogueStockState, setCatalogueStockState] = useState({ master: true, custom: false });
  const [dragItems, setDragItems] = useState(["Item 1", "Item 2", "Item 3"]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [isProductControlsExpanded, setIsProductControlsExpanded] = useState(false);
  const [isCatalogueManagementExpanded, setIsCatalogueManagementExpanded] = useState(false);
  const [isBackupExpanded, setIsBackupExpanded] = useState(false);
  const [isRestoreExpanded, setIsRestoreExpanded] = useState(false);
  const [isShelfExpanded, setIsShelfExpanded] = useState(false);
  const [isManageCategoriesExpanded, setIsManageCategoriesExpanded] = useState(false);
  const [isBulkEditorExpanded, setIsBulkEditorExpanded] = useState(false);
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  const [isAutoRenderExpanded, setIsAutoRenderExpanded] = useState(false);
  const [isManualRenderExpanded, setIsManualRenderExpanded] = useState(false);
  const [isProTipExpanded, setIsProTipExpanded] = useState(false);
  const [isTemplatesCardExpanded, setIsTemplatesCardExpanded] = useState(false);
  const [isCustomizeFieldsCardExpanded, setIsCustomizeFieldsCardExpanded] = useState(false);
  const [isProTipFieldsCardExpanded, setIsProTipFieldsCardExpanded] = useState(false);
  const [isCurrencyCardExpanded, setIsCurrencyCardExpanded] = useState(false);
  const [isPriceUnitsCardExpanded, setIsPriceUnitsCardExpanded] = useState(false);
  const [isWhereConfigureCardExpanded, setIsWhereConfigureCardExpanded] = useState(false);

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
      title: "Welcome to CatShare",
      description:
        "Learn about the key features that help you manage your product catalogues effectively.",
      icon: <RiShoppingBag3Line className="w-10 h-10 text-purple-600" />,
      visualElements: null,
    },
    {
      title: "Create Products",
      description:
        "Click the blue '+' button at the bottom right to create a new product. Fill in name, pricing, categories, and upload an image. Click the edit icon on any product to modify it.",
      icon: <RiAddCircleLine className="w-10 h-10 text-indigo-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:scale-105 transition">
              <FiPlus size={24} />
            </div>
            <p className="text-xs text-gray-600 mt-2">Blue '+' button to create product</p>
          </div>
        </div>
      ),
    },
    {
      title: "Manage Products",
      description:
        "In the Products tab, you can edit, move to shelf, reorder by dragging, and toggle stock status for each catalogue independently.",
      icon: <RiLayout4Line className="w-10 h-10 text-green-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <button
            onClick={() => setIsProductControlsExpanded(!isProductControlsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold text-gray-800 mb-2 hover:bg-blue-100 hover:shadow-md cursor-pointer transition-all duration-200 bg-blue-50 border border-blue-200 card-hover"
          >
            <span>⚙️ Product Controls:</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <FiChevronDown
                className={`transition-transform duration-300 ${isProductControlsExpanded ? "rotate-180" : "pulse-chevron"}`}
                size={18}
              />
            </div>
          </button>
          {isProductControlsExpanded && (
            <div className="space-y-2 animate-fadeIn">
              <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
                <FiEdit className="text-blue-600" size={16} />
                <span>Modify product details</span>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded text-xs flex items-center gap-2">
                <MdInventory2 className="text-red-500 text-[18px]" />
                <span>Move to shelf (can restore)</span>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded space-y-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">Stock status per catalogue:</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatalogueStockState({...catalogueStockState, master: !catalogueStockState.master})}
                    className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                      catalogueStockState.master ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {catalogueStockState.master ? "In" : "Out"}
                  </button>
                  <span className="text-xs text-gray-600">- Master catalogue</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatalogueStockState({...catalogueStockState, custom: !catalogueStockState.custom})}
                    className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                      catalogueStockState.custom ? "bg-amber-500 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {catalogueStockState.custom ? "In" : "Out"}
                  </button>
                  <span className="text-xs text-gray-600">- Custom catalogue (example)</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Each catalogue has independent stock status</p>
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
      title: "Catalogues Tab",
      description:
        "Switch to the Catalogues tab to view all your catalogues and manage them. Create new catalogues for different channels, customers, or pricing strategies.",
      icon: <RiLayout4Line className="w-10 h-10 text-blue-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("products")}
                className={`flex-1 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold transition min-w-0 ${
                  activeTab === "products"
                    ? "bg-white text-gray-600 border border-gray-300"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("catalogues")}
                className={`flex-1 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-semibold transition min-w-0 ${
                  activeTab === "catalogues"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-300"
                }`}
              >
                Catalogues
              </button>
            </div>
            <div className="bg-white rounded border border-gray-300 p-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Catalogues Tab Features:</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ View all your catalogues in one place</p>
                  <p>✓ Create unlimited custom catalogues</p>
                  <p>✓ Each catalogue has its own pricing & stock settings</p>
                  <p>✓ View products filtered by catalogue</p>
                  <p>✓ See pricing and fields specific to each catalogue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Manage Catalogues",
      description:
        "Create, edit, delete, and reorder multiple catalogues. Default 'Master' catalogue is always available. Create custom ones for different pricing models or channels.",
      icon: <RiExchangeDollarLine className="w-10 h-10 text-red-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <button
            onClick={() => setIsCatalogueManagementExpanded(!isCatalogueManagementExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold text-gray-800 mb-2 hover:bg-blue-100 hover:shadow-md cursor-pointer transition-all duration-200 bg-blue-50 border border-blue-200 card-hover"
          >
            <span>📋 Catalogue Management:</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <FiChevronDown
                className={`transition-transform duration-300 ${isCatalogueManagementExpanded ? "rotate-180" : "pulse-chevron"}`}
                size={18}
              />
            </div>
          </button>
          {isCatalogueManagementExpanded && (
            <div className="space-y-2 animate-fadeIn">
              <div className="p-2 bg-white border border-gray-300 rounded text-xs">
                <p className="font-semibold text-gray-700 mb-1">📋 Master Catalogue (Default)</p>
                <p className="text-gray-600">Always available. Cannot be deleted. Use for your primary pricing/channel.</p>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded text-xs">
                <p className="font-semibold text-gray-700 mb-1">➕ Create New</p>
                <p className="text-gray-600">Click the '+' button in Catalogues tab to create a new catalogue with custom pricing fields.</p>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded text-xs">
                <p className="font-semibold text-gray-700 mb-1">✏️ Edit Catalogue</p>
                <p className="text-gray-600">Click edit to change name, pricing fields, and other settings for a catalogue.</p>
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded text-xs">
                <p className="font-semibold text-gray-700 mb-1">🗑️ Delete Catalogue</p>
                <p className="text-gray-600">Remove custom catalogues. Master cannot be deleted.</p>
              </div>
              <div className="p-2 bg-green-50 border border-green-300 rounded text-xs">
                <p className="font-semibold text-green-700">💡 Tip:</p>
                <p className="text-green-700">Create separate catalogues for Wholesale, Resell, Distributor, or any other pricing model you need!</p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Product Fields & Templates",
      description:
        "Customize your product information by choosing field templates or creating custom fields. Templates provide pre-configured fields for different industries.",
      icon: <RiLayout4Line className="w-10 h-10 text-orange-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-3">
          <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500 card-hover">
            <button
              onClick={() => setIsTemplatesCardExpanded(!isTemplatesCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800">📋 What are Templates?</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isTemplatesCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isTemplatesCardExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">
                  Pre-configured field sets for different industries:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-3">
                  <li>✓ Fashion & Apparel (Size, Color, Fit, etc.)</li>
                  <li>✓ Lifestyle & Personal Care</li>
                  <li>✓ Home & Furniture</li>
                  <li>✓ Electronics</li>
                  <li>✓ Hardware & Tools</li>
                  <li>✓ Custom/General Products</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 card-hover">
            <button
              onClick={() => setIsCustomizeFieldsCardExpanded(!isCustomizeFieldsCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800">⚙️ Customize Fields</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isCustomizeFieldsCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isCustomizeFieldsCardExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">In Settings → Product Fields, you can:</p>
                <ul className="text-xs text-gray-600 space-y-1 ml-3">
                  <li>✓ Choose a template for your industry</li>
                  <li>✓ Enable/disable specific fields</li>
                  <li>✓ Rename field labels (e.g., "Size" → "Dimensions")</li>
                  <li>✓ Add custom fields (up to 10 custom fields)</li>
                  <li>✓ Configure units for fields (e.g., kg, pieces, etc.)</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500 card-hover">
            <button
              onClick={() => setIsProTipFieldsCardExpanded(!isProTipFieldsCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-green-800">💡 Pro Tip:</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isProTipFieldsCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isProTipFieldsCardExpanded && (
              <p className="text-xs text-green-700 mt-3 animate-fadeIn">
                Field changes apply to all products. Customize once, then add products knowing your structure is perfect!
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Currency & Price Units",
      description:
        "Configure your default currency and set up price units (pieces, dozen, kg, etc.) for consistent pricing across all catalogues.",
      icon: <RiExchangeDollarLine className="w-10 h-10 text-emerald-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-3">
          <div className="p-3 bg-white rounded-lg border-l-4 border-emerald-500 card-hover">
            <button
              onClick={() => setIsCurrencyCardExpanded(!isCurrencyCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800">💱 Default Currency</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isCurrencyCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isCurrencyCardExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">Choose your primary currency:</p>
                <ul className="text-xs text-gray-600 space-y-1 ml-3">
                  <li>✓ 15+ standard currencies (USD, EUR, INR, GBP, etc.)</li>
                  <li>✓ Custom currency support (create your own symbol)</li>
                  <li>✓ Applied to all product prices</li>
                  <li>✓ Shows in rendered images automatically</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 card-hover">
            <button
              onClick={() => setIsPriceUnitsCardExpanded(!isPriceUnitsCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800">📦 Price Units</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isPriceUnitsCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isPriceUnitsCardExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">Set available pricing options:</p>
                <ul className="text-xs text-gray-600 space-y-1 ml-3">
                  <li>✓ Default: pieces, dozen, sets, kg</li>
                  <li>✓ Add custom units (boxes, bundles, etc.)</li>
                  <li>✓ Use different units per catalogue if needed</li>
                  <li>✓ Applies when adding/editing prices</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500 card-hover">
            <button
              onClick={() => setIsWhereConfigureCardExpanded(!isWhereConfigureCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-amber-800">⚙️ Where to Configure</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isWhereConfigureCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isWhereConfigureCardExpanded && (
              <p className="text-xs text-amber-700 mt-3 animate-fadeIn">
                Go to Settings → Currency/Price Units to change these settings. Changes apply instantly to all products and catalogues!
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Backup & Restore",
      description:
        "Protect your catalogue data with Backup & Restore. Create ZIP file backups including all products, images, fields, currency settings, and catalogues. Changes include backing up currency and price units for complete restoration.",
      icon: <RiShieldLine className="w-10 h-10 text-cyan-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="space-y-4">
            {/* Backup Section */}
            <div className="p-3 bg-white rounded-lg border-l-4 border-blue-600">
              <button
                onClick={() => setIsBackupExpanded(!isBackupExpanded)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-sm card-hover"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-pulse">💾</span>
                  <p className="font-semibold text-sm text-gray-800">Backup</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FiChevronDown
                    className={`transition-transform duration-300 ${isBackupExpanded ? "rotate-180" : ""}`}
                    size={16}
                  />
                </div>
              </button>
              {isBackupExpanded && (
                <div className="space-y-2 text-xs text-gray-700 mt-3 animate-fadeIn">
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
                    <li>✓ All catalogues configuration</li>
                    <li>✓ Deleted products list</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Restore Section */}
            <div className="p-3 bg-white rounded-lg border-l-4 border-green-600">
              <button
                onClick={() => setIsRestoreExpanded(!isRestoreExpanded)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-green-50 transition-all duration-200 hover:shadow-sm card-hover"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-pulse">🔄</span>
                  <p className="font-semibold text-sm text-gray-800">Restore</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FiChevronDown
                    className={`transition-transform duration-300 ${isRestoreExpanded ? "rotate-180" : ""}`}
                    size={16}
                  />
                </div>
              </button>
              {isRestoreExpanded && (
                <div className="space-y-2 text-xs text-gray-700 mt-3 animate-fadeIn">
                  <p>
                    <span className="font-medium">How it works:</span> Click "Backup & Restore" → Select "Restore" → Choose a backup ZIP file to recover your catalogue.
                  </p>
                  <p>
                    <span className="font-medium">What restores:</span>
                  </p>
                  <ul className="ml-3 space-y-1">
                    <li>✓ All products with original details</li>
                    <li>✓ All product images</li>
                    <li>✓ Catalogues configuration</li>
                    <li>✓ Categories and deleted products</li>
                  </ul>
                  <p className="text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                    💡 Restore replaces your current catalogue with the backed-up data.
                  </p>
                  <p className="text-red-700 bg-red-50 p-2 rounded">
                    ⚠️ After restore, you MUST render images to share the created catalogues.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Extra Features",
      description:
        "Access additional tools from the side menu.",
      icon: <RiSettings4Line className="w-10 h-10 text-amber-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-3">
          {/* Shelf Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-red-500">
            <button
              onClick={() => setIsShelfExpanded(!isShelfExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-sm card-hover"
            >
              <div className="flex items-center gap-2">
                <MdInventory2 className="text-red-500 text-[18px] animate-pulse" />
                <p className="font-semibold text-sm text-gray-800">Shelf</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isShelfExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isShelfExpanded && (
              <div className="space-y-2 text-xs text-gray-700 mt-3 animate-fadeIn">
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
            )}
          </div>

          {/* Manage Categories Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500">
            <button
              onClick={() => setIsManageCategoriesExpanded(!isManageCategoriesExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-sm card-hover"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg animate-pulse">🗂️</span>
                <p className="font-semibold text-sm text-gray-800">Manage Categories</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isManageCategoriesExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isManageCategoriesExpanded && (
              <div className="space-y-2 text-xs text-gray-700 mt-3 animate-fadeIn">
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
            )}
          </div>

          {/* Bulk Editor Section */}
          <div className="p-3 bg-white rounded-lg border-l-4 border-purple-500">
            <button
              onClick={() => setIsBulkEditorExpanded(!isBulkEditorExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-purple-50 transition-all duration-200 hover:shadow-sm card-hover"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg animate-pulse">✏️</span>
                <p className="font-semibold text-sm text-gray-800">Bulk Editor</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isBulkEditorExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isBulkEditorExpanded && (
              <div className="space-y-2 text-xs text-gray-700 mt-3 animate-fadeIn">
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
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Render Images",
      description:
        "Generate professional product images to share. Auto-renders after add/edit, but manual render needed after Restore or Bulk Edit. Renders for all catalogues automatically.",
      icon: <RiImage2Line className="w-10 h-10 text-pink-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-orange-400 space-y-3">
          {/* How It Works */}
          <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500 card-hover">
            <button
              onClick={() => setIsHowItWorksExpanded(!isHowItWorksExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-yellow-50 transition-all duration-200 -mx-3"
            >
              <p className="font-semibold text-sm text-gray-800">💾 What Render Does:</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isHowItWorksExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isHowItWorksExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">
                  Generates professional product images for each catalogue with pricing, names, and details overlaid on each product image.
                </p>
                <ul className="text-xs text-gray-700 space-y-1 ml-3">
                  <li>✓ Product name overlaid on image</li>
                  <li>✓ Pricing information from each catalogue</li>
                  <li>✓ Product details and specifications</li>
                  <li>✓ One image per product per catalogue</li>
                  <li>✓ Shareable with customers</li>
                </ul>
              </div>
            )}
          </div>

          {/* Auto Render Info */}
          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500 card-hover">
            <button
              onClick={() => setIsAutoRenderExpanded(!isAutoRenderExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-green-100 transition-all duration-200 -mx-3"
            >
              <p className="font-semibold text-sm text-gray-800">✅ Auto-Render (Automatic):</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isAutoRenderExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isAutoRenderExpanded && (
              <p className="text-xs text-gray-700 mt-3 animate-fadeIn">
                When you <span className="font-medium">Add or Edit</span> a single product, images render automatically for all catalogues.
              </p>
            )}
          </div>

          {/* Manual Render Required */}
          <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500 card-hover">
            <button
              onClick={() => setIsManualRenderExpanded(!isManualRenderExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-red-100 transition-all duration-200 -mx-3"
            >
              <p className="font-semibold text-sm text-gray-800">⚠️ Manual Render Required:</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isManualRenderExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isManualRenderExpanded && (
              <div className="mt-3 animate-fadeIn">
                <p className="text-xs text-gray-700 mb-2">
                  You <span className="font-medium">MUST click "Render images"</span> from the side menu after:
                </p>
                <ul className="text-xs text-gray-700 space-y-1 ml-3">
                  <li>🔄 Restoring from a backup</li>
                  <li>📝 Using Bulk Editor to edit products</li>
                </ul>
                <p className="text-xs text-gray-700 mt-2">
                  <span className="font-medium">Otherwise:</span> Non-rendered images cannot be shared, and you'd need to manually edit and save each product.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Note */}
          <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 card-hover">
            <button
              onClick={() => setIsProTipExpanded(!isProTipExpanded)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-blue-100 transition-all duration-200 -mx-3"
            >
              <p className="font-semibold text-sm text-gray-800">💡 Pro tip:</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isProTipExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isProTipExpanded && (
              <p className="text-xs text-gray-700 mt-3 animate-fadeIn">
                Always render images after bulk operations - it takes minutes to render everything at once instead of hours editing individually! Rendering happens for all catalogues automatically.
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "When to Access This Tutorial",
      description:
        "You can revisit this tutorial anytime to refresh your knowledge or learn features you might have missed.",
      icon: <RiSearchLine className="w-10 h-10 text-blue-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-3">
          <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 card-hover">
            <button
              onClick={() => setIsTemplatesCardExpanded(!isTemplatesCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800">🎓 How to Access Tutorial</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isTemplatesCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isTemplatesCardExpanded && (
              <div className="mt-3 animate-fadeIn space-y-2 text-xs text-gray-700">
                <p>You can open this tutorial at any time from:</p>
                <ul className="space-y-2 ml-3">
                  <li><span className="font-medium">📌 First Time:</span> Automatically shown when you start CatShare</li>
                  <li><span className="font-medium">⚙️ Settings Menu:</span> Click on the Menu button → Look for "Help" or "Tutorial" option</li>
                  <li><span className="font-medium">❓ Question Mark Icon:</span> Usually found in the top navigation bar</li>
                  <li><span className="font-medium">🎯 Contextual Help:</span> Click question marks next to specific features for targeted help</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500 card-hover">
            <button
              onClick={() => setIsCustomizeFieldsCardExpanded(!isCustomizeFieldsCardExpanded)}
              className="w-full flex items-center justify-between text-left px-0 py-0 rounded-lg hover:opacity-80 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-green-800">💡 Best Time to Use</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <FiChevronDown
                  className={`transition-transform duration-300 ${isCustomizeFieldsCardExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
            </button>
            {isCustomizeFieldsCardExpanded && (
              <div className="mt-3 animate-fadeIn space-y-2 text-xs text-green-700">
                <ul className="space-y-2">
                  <li>✓ Before setting up your first catalogue</li>
                  <li>✓ When learning a new feature for the first time</li>
                  <li>✓ If you're unsure how to use a particular tool</li>
                  <li>✓ To refresh your memory on advanced features</li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <p className="font-semibold text-sm text-amber-800 mb-2">💬 Need More Help?</p>
            <p className="text-xs text-amber-700">
              Don't hesitate to use the "Send Feedback" button to ask questions or report issues. Our team is here to help!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description:
        "Congratulations! You now know all the main features. Ready to create your first product catalogue?",
      icon: <RiCheckDoubleLine className="w-10 h-10 text-green-600" />,
      visualElements: (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
          <div className="text-center text-sm">
            <p className="font-semibold text-gray-800 mb-3">Your CatShare Journey:</p>
            <p className="text-xs text-gray-600 leading-relaxed space-y-2">
              ✨ <span className="font-medium">Customize:</span> Choose templates & fields for your products<br/>
              💱 <span className="font-medium">Set Currency:</span> Configure pricing & units<br/>
              ➕ <span className="font-medium">Create Products:</span> Add details using your custom fields<br/>
              🗂️ <span className="font-medium">Organize:</span> Use categories & manage catalogues<br/>
              🖼️ <span className="font-medium">Render:</span> Generate professional product images<br/>
              💾 <span className="font-medium">Protect:</span> Backup your data regularly<br/>
              🚀 <span className="font-medium">Scale:</span> Manage multiple pricing models effortlessly!
            </p>
            <p className="text-xs text-gray-700 font-semibold mt-4">Happy cataloguing! 🎉</p>
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
    <>
      <style>{tutorialStyles}</style>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
      <div
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500 hover:scale-110 transition-all duration-200"
        >
          ✕
        </button>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6 overflow-hidden shadow-sm">
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-500 rounded-full progress-bar-active"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step icon and title */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 tutorial-icon floating-icon">
              {typeof step.icon === 'string' ? (
                <div className="text-5xl">{step.icon}</div>
              ) : (
                step.icon
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            {step.title}
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">
            {step.description}
          </p>
        </div>

        {/* Visual elements */}
        {step.visualElements && (
          <div className="mb-4 animate-fadeIn">
            {step.visualElements}
          </div>
        )}

        {/* Step counter */}
        <div className="text-center mb-6 flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: steps.length }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-gradient-to-r from-blue-500 to-blue-600"
                    : i < currentStep
                    ? "w-2 bg-blue-400"
                    : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-500 ml-2">
            {currentStep + 1}/{steps.length}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 text-sm button-hover ${
              currentStep === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95"
            }`}
          >
            ← Back
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-sm button-hover active:scale-95"
          >
            Exit
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm button-hover active:scale-95 shadow-lg hover:shadow-xl"
          >
            {currentStep === steps.length - 1 ? "✓ Done" : "Next →"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
