import React, { useEffect, useState } from "react";
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

  const isNative = Capacitor.getPlatform() !== "web";

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
      const modalOpen = document.querySelector(".fixed.z-50");
      if (modalOpen) {
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
              setDarkMode={setDarkMode}
              products={products}
              setProducts={setProducts}
              deletedProducts={deletedProducts}
              setDeletedProducts={setDeletedProducts}
              isRendering={isRendering}
              setIsRendering={setIsRendering}
              renderProgress={renderProgress}
              setRenderProgress={setRenderProgress}
            />
          }
        />
        <Route
          path="/settings/appearance"
          element={<AppearanceSettings darkMode={darkMode} setDarkMode={setDarkMode} />}
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
