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
    {
      id: "glass",
      name: "Glass",
      description: "Modern frosted glass design with transparency and blur effects.",
      isDefault: false,
      status: "Active",
    },
    // More themes will be added in the future
  ];

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem("selectedTheme", themeId);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: themeId } }));
  };

  // Sample products for different themes
  const classicProduct = {
    id: "sample-classic",
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
    bgColor: "#dc2626", // Dark red background
    fontColor: "white",
    cropAspectRatio: 1,
  };

  const glassProduct = {
    id: "sample-glass",
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
    bgColor: "rgba(220, 38, 38, 0.8)", // Red with transparency for glass effect
    fontColor: "white",
    cropAspectRatio: 1,
  };

  // Helper function to get lighter color for details section
  const getLighterColor = (color, theme) => {
    if (theme === "glass") {
      return "rgba(252, 165, 165, 0.8)"; // Light red with transparency for glass theme
    }
    return "#fca5a5"; // Light red for classic theme
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
        <div className="space-y-6 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose how your product cards are displayed
          </p>

          {/* Theme Cards - Each card is a selectable theme */}
          <div className="space-y-6">
            {themes.map((theme) => {
              // Get product specific to this theme
              const sampleProduct = theme.id === "classic" ? classicProduct : glassProduct;
              const isGlassTheme = theme.id === "glass";

              return (
                <div key={theme.id} className="space-y-3">
                  {/* Theme Preview Card */}
                  <div className="flex justify-center">
                    <div
                      className={`w-full sm:w-96 rounded-lg overflow-hidden shadow-md flex flex-col ${
                        isGlassTheme
                          ? "bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 border border-red-200 dark:border-red-800"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {/* Image Section */}
                      <div
                        style={{
                          backgroundColor: sampleProduct.imageBgColor || "white",
                          textAlign: "center",
                          padding: 0,
                          position: "relative",
                          boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          aspectRatio: sampleProduct.cropAspectRatio || 1,
                          width: "100%",
                        }}
                      >
                        <img
                          src={sampleProductImage}
                          alt={sampleProduct.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            margin: "0 auto",
                          }}
                        />
                      </div>

                      {/* Details Section */}
                      <div
                        style={{
                          backgroundColor: getLighterColor(sampleProduct.bgColor, theme.id),
                          color: sampleProduct.fontColor || "white",
                          padding: "12px 12px",
                          fontSize: 17,
                          flex: 1,
                          backdropFilter: isGlassTheme ? "blur(10px)" : "none",
                          border: isGlassTheme ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                          borderRadius: isGlassTheme ? "8px" : "0px",
                          margin: isGlassTheme ? "8px" : "0px",
                        }}
                      >
                        <div style={{ textAlign: "center", marginBottom: 6 }}>
                          <p
                            style={{
                              fontWeight: "normal",
                              textShadow: isGlassTheme ? "none" : "3px 3px 5px rgba(0,0,0,0.2)",
                              fontSize: 28,
                              margin: "0 0 3px 0",
                            }}
                          >
                            {sampleProduct.name}
                          </p>
                          {sampleProduct.subtitle && (
                            <p style={{ fontStyle: "italic", fontSize: 18, margin: "0 0 0 0" }}>
                              ({sampleProduct.subtitle})
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "left", lineHeight: 1.3, paddingLeft: 12, paddingRight: 8 }}>
                          <p style={{ margin: "2px 0", display: "flex" }}>
                            <span style={{ width: "90px" }}>Colour</span>
                            <span>:</span>
                            <span style={{ marginLeft: "8px" }}>{sampleProduct.color}</span>
                          </p>
                          <p style={{ margin: "2px 0", display: "flex" }}>
                            <span style={{ width: "90px" }}>Package</span>
                            <span>:</span>
                            <span style={{ marginLeft: "8px" }}>{sampleProduct.package}</span>
                          </p>
                          <p style={{ margin: "2px 0", display: "flex" }}>
                            <span style={{ width: "90px" }}>Age Group</span>
                            <span>:</span>
                            <span style={{ marginLeft: "8px" }}>{sampleProduct.ageGroup}</span>
                          </p>
                        </div>
                      </div>

                      {/* Bottom Bar - Price */}
                      <div
                        style={{
                          backgroundColor: sampleProduct.bgColor || "#add8e6",
                          color: sampleProduct.fontColor || "white",
                          padding: "6px 8px",
                          textAlign: "center",
                          fontWeight: "normal",
                          fontSize: 19,
                          flexShrink: 0,
                          backdropFilter: isGlassTheme ? "blur(10px)" : "none",
                          border: isGlassTheme ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                          borderRadius: isGlassTheme ? "8px" : "0px",
                          margin: isGlassTheme ? "0 8px 8px 8px" : "0px",
                        }}
                      >
                        Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;{sampleProduct.price} {sampleProduct.priceUnit}
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`px-8 py-3 rounded-lg font-semibold transition ${
                        selectedTheme === theme.id
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {selectedTheme === theme.id ? "✓ Selected" : "Select"} {theme.name}
                    </button>
                  </div>

                  {/* Theme Description & Features */}
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{theme.description}</p>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                        Features
                      </h4>
                      <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1">
                        {isGlassTheme ? (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 dark:text-red-400 mt-0.5">✓</span>
                              <span>Modern frosted glass effect with red accent</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 dark:text-red-400 mt-0.5">✓</span>
                              <span>Semi-transparent with blur backdrop</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 dark:text-red-400 mt-0.5">✓</span>
                              <span>Elegant and contemporary design</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 dark:text-red-400 mt-0.5">✓</span>
                              <span>Premium glass morphism style</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                              <span>Clean, minimalist product display</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                              <span>Colored background sections</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                              <span>All product details visible</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                              <span>Easy to customize colors</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
