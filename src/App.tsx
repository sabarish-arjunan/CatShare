import React, { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
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
import { KeepAwake } from '@capacitor-community/keep-awake';
import { initializeFieldSystem } from "./config/initializeFields";
import { runMigrations } from "./utils/dataMigration";
import { LocalNotifications } from '@capacitor/local-notifications';
import { initializeFirebaseMessaging, triggerBackgroundRendering } from "./services/firebaseService";
import { safeGetFromStorage, safeSetInStorage } from "./utils/safeStorage";

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
import Website from "./Website";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/ToastContainer";
import RenderingOverlay from "./RenderingOverlay";
import ErrorBoundary from "./components/ErrorBoundary";
import { saveRenderedImage } from "./Save";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { getAllCatalogues } from "./config/catalogueConfig";

function AppWithBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageMap, setImageMap] = useState({});
  const [products, setProducts] = useState(() =>
    safeGetFromStorage("products", [])
  );
  const [deletedProducts, setDeletedProducts] = useState(() =>
    safeGetFromStorage("deletedProducts", [])
  );
  const [darkMode, setDarkMode] = useState(() => {
    return safeGetFromStorage("darkMode", false);
  });
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderingTotal, setRenderingTotal] = useState(0);
  const [renderResult, setRenderResult] = useState(null);
  const renderResultTimeoutRef = useRef(null);

  const isNative = Capacitor.getPlatform() !== "web";


  // Handle rendering PNGs - uses the proven saveRenderedImage function (same as render all)
  const handleRenderPNGs = useCallback(async (customProducts?: any[], showOverlay: boolean = true) => {
    const all = customProducts || safeGetFromStorage("products", []);
    if (all.length === 0) return;

    // Force synchronous state updates so overlay renders with correct total
    if (showOverlay) {
      flushSync(() => setIsRendering(true));
    }
    flushSync(() => {
      setRenderProgress(0);
      setRenderingTotal(all.length);
    });

    // Get all catalogues
    const catalogues = getAllCatalogues();
    const totalRenders = all.length * catalogues.length;
    let renderedCount = 0;

    try {
      // Render products the same way as "Render All" does - using saveRenderedImage
      for (let i = 0; i < all.length; i++) {
        const product = all[i];

        // Skip products without images
        if (!product.image && !product.imagePath) {
          console.warn(`⚠️ Skipping ${product.name} - no image available`);
          // Update progress with actual count (i + 1), not percentage - force sync update
          flushSync(() => setRenderProgress(i + 1));
          // Dispatch progress event
          window.dispatchEvent(new CustomEvent("renderProgress", {
            detail: {
              percentage: Math.round(((i + 1) / all.length) * 100),
              current: i + 1,
              total: all.length
            }
          }));
          continue;
        }

        try {
          // Render for all catalogues
          for (const cat of catalogues) {
            // For backward compatibility, map cat1->wholesale and cat2->resell
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

            renderedCount++;
            // Calculate which product we're on (product index, not total render count)
            const productIndex = Math.floor(renderedCount / catalogues.length);
            const percentage = Math.round((productIndex / all.length) * 100);

            // Force synchronous update so progress bar updates immediately
            flushSync(() => setRenderProgress(productIndex));

            // Dispatch progress event for listeners (with both count and percentage)
            window.dispatchEvent(new CustomEvent("renderProgress", {
              detail: {
                percentage: percentage,
                current: productIndex,
                total: all.length
              }
            }));

            // Small delay to allow smooth animation before next update
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          console.log(`✅ Rendered PNGs for ${product.name} (${catalogues.length} catalogues)`);
        } catch (err) {
          console.warn(`❌ Failed to render images for ${product.name}:`, err);
        }
      }

      if (showOverlay) {
        setIsRendering(false);
        setRenderResult({
          status: "success",
          message: `PNG rendering completed for ${all.length} products and ${catalogues.length} catalogues`,
        });
      }
      console.log(`✅ Rendering complete`);
      // Set progress to 100% at the end
      setRenderProgress(all.length);
      window.dispatchEvent(new CustomEvent("renderComplete"));
    } catch (err) {
      console.error("❌ Rendering failed:", err);
      if (showOverlay) {
        setIsRendering(false);
        setRenderResult({
          status: "error",
          message: `Rendering error: ${err.message}`,
        });
      }
      window.dispatchEvent(new CustomEvent("renderComplete"));
    }
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
    safeSetInStorage("products", products);
  }, [products]);

  useEffect(() => {
    safeSetInStorage("deletedProducts", deletedProducts);
  }, [deletedProducts]);

  useEffect(() => {
    safeSetInStorage("darkMode", darkMode);
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

  // Initialize Firebase messaging for notifications
  useEffect(() => {
    const setupFirebase = async () => {
      // Ensure user has a unique ID
      if (!localStorage.getItem("userId")) {
        localStorage.setItem("userId", `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
      await initializeFirebaseMessaging();
    };
    setupFirebase();

    // Listen for Firebase notifications
    const handleFirebaseNotification = (event: any) => {
      console.log("Firebase notification received in app:", event.detail);
      setRenderResult({
        status: "success",
        message: event.detail.body || "Rendering completed successfully!",
      });
      setRenderProgress(100);
    };

    window.addEventListener("firebaseNotification", handleFirebaseNotification);
    return () => {
      window.removeEventListener("firebaseNotification", handleFirebaseNotification);
    };
  }, []);

  // Initialize catalogue system with data migration
  useEffect(() => {
    const runAsyncMigrations = async () => {
      try {
        await runMigrations();
      } catch (err) {
        console.error("❌ Migrations failed:", err);
      }
    };
    runAsyncMigrations();
  }, []);

  // Auto-resume rendering if it was interrupted by app close/crash
  useEffect(() => {
    const checkAndResumeRendering = async () => {
      const { checkResumableRendering, resumeBackgroundRendering } = await import('./services/backgroundRendering');
      const resumableState = checkResumableRendering();

      if (resumableState && isNative) {
        console.log("📋 Found interrupted rendering, attempting to resume...", resumableState);
        setIsRendering(true);

        const products = safeGetFromStorage("products", []);
        const catalogues = getAllCatalogues();

        try {
          await resumeBackgroundRendering(
            products,
            catalogues,
            (progress) => setRenderProgress(progress.percentage),
            (result) => {
              setIsRendering(false);
              setRenderResult({
                status: result.status === "success" ? "success" : "error",
                message: result.message,
              });
            },
            (error) => {
              setIsRendering(false);
              setRenderResult({
                status: "error",
                message: `Rendering failed: ${error.message}`,
              });
            }
          );
        } catch (err) {
          console.error("❌ Failed to resume rendering:", err);
          setIsRendering(false);
        }
      }
    };

    checkAndResumeRendering();
  }, [isNative]);

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
      if (isRendering) {
        CapacitorApp.minimizeApp();
        return;
      }
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
  }, [location, navigate, isRendering]);

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
      handleRenderPNGs();
    };

    const handleRequestRenderSelectedPNGs = (event: any) => {
      const { products, showOverlay = true } = event.detail;
      if (products && products.length > 0) {
        handleRenderPNGs(products, showOverlay);
      }
    };

    window.addEventListener("requestRenderAllPNGs", handleRequestRenderAllPNGs);
    window.addEventListener("requestRenderSelectedPNGs", handleRequestRenderSelectedPNGs);
    return () => {
      window.removeEventListener("requestRenderAllPNGs", handleRequestRenderAllPNGs);
      window.removeEventListener("requestRenderSelectedPNGs", handleRequestRenderSelectedPNGs);
    };
  }, [handleRenderPNGs]);

  useEffect(() => {
    if (isNative) {
      // Request permissions for local notifications
      LocalNotifications.requestPermissions().then((permission) => {
        console.log("✅ Local notification permission requested:", permission);
      }).catch((error) => {
        console.error("❌ Failed to request local notification permissions:", error);
      });
    }
  }, [isNative]);

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
        current={renderProgress}
        total={renderingTotal}
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
              renderingTotal={renderingTotal}
              setRenderingTotal={setRenderingTotal}
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
        <Route path="/website" element={<Website />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <AppWithBackHandler />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}
