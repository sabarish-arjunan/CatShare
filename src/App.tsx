import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { initializeFieldSystem } from "./config/initializeFields";
import { runMigrations } from "./utils/dataMigration";

import CatalogueApp from "./CatalogueApp";
import CreateProduct from "./CreateProduct";
import Shelf from "./Shelf";
import Retail from "./Retail";
import Settings from "./Settings";
import AppearanceSettings from "./pages/AppearanceSettings";
import WatermarkSettings from "./pages/WatermarkSettings";
import ProInfo from "./pages/ProInfo";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/ToastContainer";
import RenderingOverlay from "./RenderingOverlay";
import { saveRenderedImage } from "./Save";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

function AppWithBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageMap, setImageMap] = useState({});
  const [products, setProducts] = useState(() =>
    JSON.parse(localStorage.getItem("products") || "[]")
  );
  const [deletedProducts, setDeletedProducts] = useState(() =>
    JSON.parse(localStorage.getItem("deletedProducts") || "[]")
  );
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderResult, setRenderResult] = useState(null);
  const renderResultTimeoutRef = useRef(null);

  const isNative = Capacitor.getPlatform() !== "web";

  // Handle rendering all PNGs
  const handleRenderAllPNGs = useCallback(async () => {
    const all = JSON.parse(localStorage.getItem("products") || "[]");
    if (all.length === 0) return;

    setIsRendering(true);
    setRenderProgress(0);

    for (let i = 0; i < all.length; i++) {
      const product = all[i];

      // Skip products without images - don't error, just skip
      if (!product.image && !product.imagePath) {
        console.warn(`⚠️ Skipping ${product.name} - no image available`);
        setRenderProgress(Math.round(((i + 1) / all.length) * 100));
        continue;
      }

      try {
        // Render for all catalogues
        const { getAllCatalogues } = await import("./config/catalogueConfig");
        const catalogues = getAllCatalogues();

        for (const cat of catalogues) {
          const legacyType = cat.id === "cat1" ? "wholesale" : cat.id === "cat2" ? "resell" : cat.id;

          await saveRenderedImage(product, legacyType, {
            resellUnit: product.resellUnit || "/ piece",
            wholesaleUnit: product.wholesaleUnit || "/ piece",
            packageUnit: product.packageUnit || "pcs / set",
            ageGroupUnit: product.ageUnit || "months",
            catalogueId: cat.id,
            catalogueLabel: cat.label,
            folder: cat.folder || cat.label,
            priceField: cat.priceField,
            priceUnitField: cat.priceUnitField,
          });
        }

        console.log(`✅ Rendered PNGs for ${product.name} (${catalogues.length} catalogues)`);
      } catch (err) {
        console.warn(`❌ Failed to render images for ${product.name}`, err);
      }

      setRenderProgress(Math.round(((i + 1) / all.length) * 100));
    }

    setRenderResult({
      status: "success",
      message: "PNG rendering completed for all products",
    });
    setIsRendering(false);
    window.dispatchEvent(new CustomEvent("renderComplete"));
  }, []);

  useEffect(() => {
    if (!isNative) return;
    const applyFullscreen = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.hide();
      } catch (e) {
        console.warn("StatusBar hide failed:", e);
      }
    };

    // run once
    applyFullscreen();

    // re-apply on app resume
    let removeResume: any;
    CapacitorApp.addListener("resume", applyFullscreen).then((listener) => {
      removeResume = listener.remove;
    });

    // re-apply when page becomes visible
    const onVis = () => {
      if (!document.hidden) applyFullscreen();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (removeResume) removeResume();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isNative]);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("deletedProducts", JSON.stringify(deletedProducts));
  }, [deletedProducts]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Initialize field system with data migration on first load
  useEffect(() => {
    initializeFieldSystem();
  }, []);

  // Initialize catalogue system with data migration
  useEffect(() => {
    runMigrations();
  }, []);

  // Initialize watermark settings with defaults on first load
  useEffect(() => {
    const showWatermark = localStorage.getItem("showWatermark");
    const watermarkText = localStorage.getItem("watermarkText");
    const watermarkPosition = localStorage.getItem("watermarkPosition");

    if (showWatermark === null) {
      localStorage.setItem("showWatermark", JSON.stringify(false)); // Default: disabled
    }
    if (watermarkText === null) {
      localStorage.setItem("watermarkText", "Created using CatShare");
    }
    if (watermarkPosition === null) {
      localStorage.setItem("watermarkPosition", "bottom-center");
    }
  }, []);

  useEffect(() => {
    const handleNewProduct = () =>
      setProducts(JSON.parse(localStorage.getItem("products") || "[]"));
    window.addEventListener("product-added", handleNewProduct);
    return () =>
      window.removeEventListener("product-added", handleNewProduct);
  }, []);

  useEffect(() => {
    let removeListener: any;
    CapacitorApp.addListener("backButton", () => {
      const fullScreenImageOpen = document.querySelector('[data-fullscreen-image="true"]');
      // Check for product preview modal backdrop (backdrop-blur-xl with z-50)
      const previewModalOpen = document.querySelector(".backdrop-blur-xl.z-50");
      if (fullScreenImageOpen || previewModalOpen) {
        window.dispatchEvent(new CustomEvent("close-preview"));
      } else if (location.pathname !== "/") {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    }).then((listener) => {
      removeListener = listener.remove;
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, [location, navigate]);

  // Listen for render request from watermark settings and other components
  // Auto-dismiss render result popup after 5 seconds
  useEffect(() => {
    if (renderResult) {
      if (renderResultTimeoutRef.current) {
        clearTimeout(renderResultTimeoutRef.current);
      }
      renderResultTimeoutRef.current = setTimeout(() => {
        setRenderResult(null);
      }, 5000);
    }
    return () => {
      if (renderResultTimeoutRef.current) {
        clearTimeout(renderResultTimeoutRef.current);
      }
    };
  }, [renderResult]);

  useEffect(() => {
    const handleRequestRenderAllPNGs = () => {
      handleRenderAllPNGs();
    };

    window.addEventListener("requestRenderAllPNGs", handleRequestRenderAllPNGs);
    return () => window.removeEventListener("requestRenderAllPNGs", handleRequestRenderAllPNGs);
  }, [handleRenderAllPNGs]);

  return (
    <div
      style={{
        boxSizing: "border-box",
        height: "100%",
        backgroundColor: "#fff",
      }}
    >
      <ToastContainer />
      <RenderingOverlay
        visible={isRendering}
        current={Math.round((renderProgress / 100) * products.length)}
        total={products.length}
      />

      {/* Global Success/Error Popup after rendering completes */}
      {renderResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              {renderResult.status === "success" ? (
                <FiCheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <FiAlertCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {renderResult.status === "success" ? "Success!" : "Failed"}
            </h2>

            <p className="text-sm text-gray-600 mb-5">
              {renderResult.message}
            </p>

            <button
              onClick={() => {
                if (renderResultTimeoutRef.current) {
                  clearTimeout(renderResultTimeoutRef.current);
                }
                setRenderResult(null);
              }}
              className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <CatalogueApp
              products={products}
              setProducts={setProducts}
              deletedProducts={deletedProducts}
              setDeletedProducts={setDeletedProducts}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              isRendering={isRendering}
              setIsRendering={setIsRendering}
              renderProgress={renderProgress}
              setRenderProgress={setRenderProgress}
              renderResult={renderResult}
              setRenderResult={setRenderResult}
            />
          }
        />
        <Route path="/create" element={<CreateProduct />} />
        <Route
          path="/shelf"
          element={
            <Shelf
              deletedProducts={deletedProducts}
              setDeletedProducts={setDeletedProducts}
              setProducts={setProducts}
              products={products}
              imageMap={imageMap}
            />
          }
        />
        <Route path="/retail" element={<Retail products={products} />} />
        <Route
          path="/settings"
          element={
            <Settings
              darkMode={darkMode}
              setDarkMode={setDarkMode as any}
              products={products}
              setProducts={setProducts as any}
              deletedProducts={deletedProducts}
              setDeletedProducts={setDeletedProducts as any}
              isRendering={isRendering}
              setIsRendering={setIsRendering as any}
              renderProgress={renderProgress}
              setRenderProgress={setRenderProgress as any}
            />
          }
        />
        <Route
          path="/settings/appearance"
          element={<AppearanceSettings darkMode={darkMode} setDarkMode={setDarkMode as any} />}
        />
        <Route
          path="/settings/watermark"
          element={<WatermarkSettings />}
        />
        <Route
          path="/settings/pro"
          element={<ProInfo />}
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppWithBackHandler />
      </Router>
    </ToastProvider>
  );
}
