import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

export default function ThemesSettings() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "classic";
  });

  // List of available themes
  const themes = [
    {
      id: "classic",
      name: "Classic",
      description: "The default product card layout. Clean and minimalist design.",
      isDefault: true,
      status: "Active",
    },
    // More themes will be added in the future
  ];

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem("selectedTheme", themeId);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: themeId } }));
  };

  const getThemeDetails = (themeId) => {
    return themes.find((theme) => theme.id === themeId);
  };

  const selectedThemeDetails = getThemeDetails(selectedTheme);

  // Sample product for preview
  const sampleProduct = {
    id: "sample-preview",
    name: "Frock",
    subtitle: "Fancy wear",
    color: "Red",
    package: "5 pcs / set",
    ageGroup: "5 years",
    price: "₹200",
    priceUnit: "/ piece",
    inStock: true,
    badge: null,
    imageBgColor: "white",
  };

  // Sample product image - same as used in watermark settings
  const sampleProductImage =
    "https://cdn.builder.io/api/v1/image/assets%2F9de8f88039f043c2bb2e12760a839fad%2F7f2e888f655c4a6d8e8d286a6b93b85a?format=webp&width=800&height=1200";

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-950 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center dark:text-white">Themes</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose how your product cards are displayed
          </p>

          {/* Themes List */}
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedTheme === theme.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold dark:text-white">{theme.name}</h3>
                      {theme.isDefault && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{theme.description}</p>
                  </div>

                  {/* Radio Button */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        selectedTheme === theme.id
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selectedTheme === theme.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Theme Preview Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h3>

            {/* Classic Theme Preview */}
            {selectedTheme === "classic" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Here's how your product cards will look in the {selectedThemeDetails?.name} theme:
                </p>

                {/* Product Listing Preview - Shows how preview images will look */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-full sm:w-96 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                      {/* Product Image */}
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={sampleProductImage}
                          alt={sampleProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details Section - Red Background */}
                      <div className="bg-red-100 dark:bg-red-900/30">
                        {/* Content Area */}
                        <div className="px-6 py-6 text-center">
                          {/* Product Name */}
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {sampleProduct.name}
                          </h3>

                          {/* Subtitle */}
                          <p className="text-sm italic text-gray-700 dark:text-gray-300 mb-4">
                            ({sampleProduct.subtitle})
                          </p>

                          {/* Details Section */}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-gray-800 dark:text-gray-200">
                              <span>Colour</span>
                              <span className="font-medium">: {sampleProduct.color}</span>
                            </div>
                            <div className="flex justify-between text-gray-800 dark:text-gray-200">
                              <span>Package</span>
                              <span className="font-medium">: {sampleProduct.package}</span>
                            </div>
                            <div className="flex justify-between text-gray-800 dark:text-gray-200">
                              <span>Age Group</span>
                              <span className="font-medium">: {sampleProduct.ageGroup}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price Bar - Dark Red (No Gap) */}
                        <div className="bg-red-700 dark:bg-red-800 text-white text-center py-3 px-6">
                          <p className="text-base font-bold">
                            Price : {sampleProduct.price} {sampleProduct.priceUnit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    This is how preview images will display with the Classic theme
                  </p>
                </div>

                {/* Theme Details */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Classic Theme Features
                  </h4>
                  <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>Clean, minimalist card design</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>Product name overlay on image</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>Price badge with green highlight</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>Stock status indicator</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Current Selection Info */}
          {selectedThemeDetails && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
                Current Theme: {selectedThemeDetails.name}
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {selectedThemeDetails.description}
              </p>
            </div>
          )}

          {/* Coming Soon Info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">
              More Themes Coming Soon
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We're working on additional product card layouts to give you more customization options for your product displays.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
