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
    if (isNative) {
      // Ensure app content starts below status bar
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setStyle({ style: Style.Dark });
    }
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
        paddingTop: "env(safe-area-inset-top, 35px)", // Always leave room for status bar
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
