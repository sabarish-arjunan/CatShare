import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import { getAllThemes } from "../config/themeConfig";

export default function ThemesSettings() {
  const navigate = useNavigate();
  const { selectedThemeId, setTheme } = useTheme();
  const [expandedThemeId, setExpandedThemeId] = useState(selectedThemeId);

  // Update expanded theme if selected theme changes from outside
  useEffect(() => {
    if (selectedThemeId) {
      setExpandedThemeId(selectedThemeId);
    }
  }, [selectedThemeId]);

  // Get all available themes from theme config
  const themes = getAllThemes();

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    console.log(`🎨 Theme selected: ${themeId}`);
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
    badge: "PREMIUM",
    imageBgColor: "white",
    bgColor: "#dc2626", // Dark red background
    lightBgColor: "#fca5a5", // Light red for classic
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
    badge: "PREMIUM",
    imageBgColor: "white",
    bgColor: "#0f8577", // Teal/turquoise dark
    lightBgColor: "#7fdcc7", // Teal light for gradient
    fontColor: "white",
    cropAspectRatio: 1,
  };

  // Helper function to get lighter color for details section
  const getLighterColor = (color, theme) => {
    if (theme === "glass") {
      return "rgba(252, 165, 165, 0.8)";
    }
    return "#fca5a5";
  };

  // Sample product image
  const sampleProductImage =
    "https://cdn.builder.io/api/v1/image/assets%2F9de8f88039f043c2bb2e12760a839fad%2F7f2e888f655c4a6d8e8d286a6b93b85a?format=webp&width=800&height=1200";

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 dark:bg-slate-950 relative selection:bg-red-100 dark:selection:bg-red-900/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-red-100/30 dark:bg-red-900/10 blur-[80px] rounded-full"></div>
      </div>

      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      <header className="sticky top-[40px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 h-16 flex items-center gap-4 px-5 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
        >
          <MdArrowBack size={22} />
        </button>
        <div className="flex flex-col flex-1 items-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Themes</h1>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.2em] ml-1">Appearance</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-8 pb-32 z-10">
        <div className="max-w-xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Choose Style</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto font-medium">
              Pick the perfect aesthetic to showcase your unique product catalog
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {themes.map((theme) => {
              const sampleProduct = theme.id === "classic" ? classicProduct : glassProduct;
              const isGlassTheme = theme.id === "glass";
              const isExpanded = expandedThemeId === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`group flex flex-col transition-all duration-500 rounded-[2.5rem] overflow-hidden border-2 ${
                    isExpanded
                      ? "bg-white dark:bg-slate-900 border-red-500/20 shadow-2xl shadow-red-500/10 ring-1 ring-red-500/5 p-6"
                      : "bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm p-4"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => setExpandedThemeId(isExpanded ? null : theme.id)}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                        selectedThemeId === theme.id
                          ? "bg-red-600 text-white scale-110"
                          : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                      }`}>
                        <span className="text-sm font-black uppercase tracking-tighter">
                          {theme.id === "classic" ? "CL" : "GL"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{theme.name} Edition</h3>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isGlassTheme ? "bg-blue-400" : "bg-emerald-400"}`}></span>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                            {isGlassTheme ? "Ultra Modern" : "Universal Clean"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThemeSelect(theme.id);
                        }}
                        className={`px-5 py-2.5 rounded-xl font-black text-[11px] transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-lg ${
                          selectedThemeId === theme.id
                            ? "bg-red-600 text-white shadow-red-500/30"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                        }`}
                      >
                        {selectedThemeId === theme.id ? "Selected" : "Select"}
                        {selectedThemeId === theme.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="relative">
                        {selectedThemeId === theme.id && (
                          <div className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-slate-50 dark:border-slate-950 z-30 transform rotate-12">
                            <span className="text-lg font-bold">✓</span>
                          </div>
                        )}

                        <div className="flex justify-center mb-10 transform transition-transform duration-500 group-hover:scale-[1.02]">
                          {isGlassTheme ? (
                            <div
                              style={{
                                background: "white",
                                padding: 0,
                                display: "flex",
                                flexDirection: "column",
                                height: "auto",
                                width: "100%",
                                maxWidth: "280px",
                                borderRadius: "16px",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                                overflow: "visible",
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: sampleProduct.imageBgColor || "white",
                                  textAlign: "center",
                                  padding: 0,
                                  position: "relative",
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
                                    padding: "16px",
                                  }}
                                />
                                {sampleProduct.badge && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 12,
                                      right: 12,
                                      backgroundColor: "rgba(0, 0, 0, 0.35)",
                                      backdropFilter: "blur(20px) saturate(180%)",
                                      WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                      color: "rgba(255, 255, 255, 0.95)",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      padding: "8px 14px",
                                      borderRadius: "999px",
                                      boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3)",
                                      border: "1.5px solid rgba(255, 255, 255, 0.4)",
                                      letterSpacing: "0.5px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {sampleProduct.badge.toUpperCase()}
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%)",
                                  backgroundSize: "400% 400%",
                                  width: "100%",
                                  padding: "8px",
                                  paddingTop: "0",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  position: "relative",
                                  overflow: "visible",
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)",
                                    pointerEvents: "none",
                                    zIndex: 0,
                                  }}
                                ></div>
                                <div
                                  style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.28)",
                                    backdropFilter: "blur(25px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(25px) saturate(180%)",
                                    padding: "12px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    border: "2px solid rgba(255, 255, 255, 0.8)",
                                    borderRadius: "14px",
                                    width: "calc(100% - 16px)",
                                    marginTop: "-30px",
                                    marginLeft: "16px",
                                    marginRight: "16px",
                                    marginBottom: "16px",
                                    boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.1)",
                                    position: "relative",
                                    zIndex: 2,
                                  }}
                                >
                                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                                    <p style={{ fontWeight: "600", fontSize: 18, margin: "0 0 4px 0", color: "white" }}>
                                      {sampleProduct.name}
                                    </p>
                                    {sampleProduct.subtitle && (
                                      <p style={{ fontStyle: "italic", fontSize: 13, margin: 0, color: "white" }}>
                                        ({sampleProduct.subtitle})
                                      </p>
                                    )}
                                  </div>
                                  <div style={{ flex: 1, marginBottom: 8, color: "white", fontSize: 13, width: "100%", paddingLeft: 20, paddingRight: 20 }}>
                                    <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                                      <span style={{ fontWeight: "500", textAlign: "right", flex: 1 }}>Colour</span>
                                      <span style={{ fontWeight: "500" }}>:</span>
                                      <span style={{ textAlign: "left", flex: 1 }}>{sampleProduct.color}</span>
                                    </div>
                                    <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                                      <span style={{ fontWeight: "500", textAlign: "right", flex: 1 }}>Package</span>
                                      <span style={{ fontWeight: "500" }}>:</span>
                                      <span style={{ textAlign: "left", flex: 1 }}>{sampleProduct.package}</span>
                                    </div>
                                    <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                                      <span style={{ fontWeight: "500", textAlign: "right", flex: 1 }}>Age Group</span>
                                      <span style={{ fontWeight: "500" }}>:</span>
                                      <span style={{ textAlign: "left", flex: 1 }}>{sampleProduct.ageGroup}</span>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      backgroundColor: "#dc2626",
                                      color: "white",
                                      padding: "6px 16px",
                                      textAlign: "center",
                                      fontWeight: "600",
                                      fontSize: 16,
                                      borderRadius: "10px",
                                      marginTop: 8,
                                      width: "calc(100% - 32px)",
                                      whiteSpace: "nowrap",
                                      border: "1px solid rgba(0, 0, 0, 0.1)",
                                    }}
                                  >
                                    {sampleProduct.price} {sampleProduct.priceUnit}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                maxWidth: "280px",
                                backgroundColor: "white",
                                borderRadius: "8px",
                                overflow: "hidden",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                border: "1px solid rgb(229, 231, 235)",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
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
                                {sampleProduct.badge && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: 10,
                                      right: 10,
                                      backgroundColor: "#666666",
                                      color: "white",
                                      fontSize: 12,
                                      fontWeight: 400,
                                      padding: "5px 10px",
                                      borderRadius: "999px",
                                      opacity: 0.95,
                                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                                      border: "1px solid rgba(0,0,0,0.2)",
                                      letterSpacing: "0.4px",
                                      pointerEvents: "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {sampleProduct.badge.toUpperCase()}
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  backgroundColor: getLighterColor(sampleProduct.bgColor, theme.id),
                                  color: sampleProduct.fontColor || "white",
                                  padding: "12px 12px",
                                  fontSize: 17,
                                  flex: 1,
                                }}
                              >
                                <div style={{ textAlign: "center", marginBottom: 6 }}>
                                  <p style={{ fontWeight: "normal", textShadow: "3px 3px 5px rgba(0,0,0,0.2)", fontSize: 28, margin: "0 0 3px 0" }}>
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

                              <div
                                style={{
                                  backgroundColor: sampleProduct.bgColor || "#add8e6",
                                  color: sampleProduct.fontColor || "white",
                                  padding: "6px 8px",
                                  textAlign: "center",
                                  fontWeight: "normal",
                                  fontSize: 19,
                                  flexShrink: 0,
                                }}
                              >
                                Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;{sampleProduct.price} {sampleProduct.priceUnit}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {theme.description}
                          </p>
                          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4">Key Features</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {isGlassTheme ? (
                                <>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Frosted Glass</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>3D Depth Effect</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Vibrant Gradients</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Premium Polish</span>
                                  </li>
                                </>
                              ) : (
                                <>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Minimalist Grid</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>High Readability</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Fast Rendering</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
                                    <span>Custom Colors</span>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative group p-1 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-[2.4rem] p-8 space-y-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-3xl mb-2 text-3xl shadow-inner border border-amber-200/50">✨</div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">More Themes Coming</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">We're crafting new breathtaking layouts to give your products the spotlight they deserve.</p>
              </div>
              <div className="pt-2">
                <span className="px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">Stay Tuned</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
