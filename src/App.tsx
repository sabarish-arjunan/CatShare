import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

import CatalogueApp from "./CatalogueApp";
import CreateProduct from "./CreateProduct";
import Shelf from "./Shelf";

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

  const isNative = Capacitor.getPlatform() !== "web";

  useEffect(() => {
    if (!isNative) return;
    const ensure = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#3b82f6' });
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.warn("StatusBar set failed:", e);
      }
    };

    // run once
    ensure();

    // re-apply on app resume
    let removeResume: any;
    CapacitorApp.addListener("resume", ensure).then((listener) => {
      removeResume = listener.remove;
    });

    // re-apply when page becomes visible
    const onVis = () => {
      if (!document.hidden) ensure();
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
        minHeight: "100%",
        backgroundColor: "#fff",
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <CatalogueApp
              products={products}
              setProducts={setProducts}
              deletedProducts={deletedProducts}
              setDeletedProducts={setDeletedProducts}
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
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWithBackHandler />
    </Router>
  );
}
