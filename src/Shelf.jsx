import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineHome } from "react-icons/md";
import ProductPreviewModal from "./ProductPreviewModal";
import SideDrawer from "./SideDrawer";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Filesystem, Directory } from "@capacitor/filesystem";

export default function Shelf({ deletedProducts, setDeletedProducts, setProducts, products, imageMap: globalImageMap }) {
  const [previewProduct, setPreviewProduct] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [imageMap, setImageMap] = useState({});

  const navigate = useNavigate();

  // Load imageMap for deleted products
  useEffect(() => {
    const loadShelfImages = async () => {
      const map = {};
      for (const p of deletedProducts) {
        if (p.imagePath) {
          try {
            const result = await Filesystem.readFile({
              path: p.imagePath,
              directory: Directory.Data,
            });
            map[p.id] = `data:image/png;base64,${result.data}`;
          } catch {
            map[p.id] = p.image || "";
          }
        } else {
          map[p.id] = p.image || "";
        }
      }
      setImageMap(map);
    };
    loadShelfImages();
  }, [deletedProducts]);

  const handleRestore = (product) => {
    setProducts((prev) => [product, ...prev]);
    setDeletedProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      setDeletedProducts((prev) => prev.filter((p) => p.id !== deleteTargetId));
      setDeleteTargetId(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 relative" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <header className="sticky top-[env(safe-area-inset-top)] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center gap-3 relative">
        <button
          onClick={() => setMenuOpen(true)}
          className="text-2xl font-bold text-gray-700"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">Shelf</h1>
        <button
          onClick={() => navigate("/")}
          className="text-[24px] text-gray-600 hover:text-blue-600 transition rounded-full p-1 hover:bg-gray-200"
          title="Go to Home"
        >
          <MdOutlineHome />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {deletedProducts.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">Shelf is empty</div>
        ) : (
          <div className="space-y-3 mt-4">
            {deletedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => setPreviewProduct(p)}
                className="flex justify-between items-center border p-3 rounded bg-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden border bg-white flex items-center justify-center">
                    {imageMap[p.id] ? (
                      <img
                        src={imageMap[p.id]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.innerHTML =
                            '<span class="text-[10px] text-gray-400 text-xs">Image broken</span>';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.color}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(p);
                    }}
                    className="text-xs font-medium px-3 py-1 bg-green-500 text-white rounded hover:bg-green-700"
                  >
                    Restore
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      Haptics.impact({ style: ImpactStyle.Medium });
                      confirmDelete(p.id);
                    }}
                    className="text-xs font-medium px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {previewProduct && (
          <ProductPreviewModal
            product={previewProduct}
            tab="shelf"
            filteredProducts={deletedProducts}
            onClose={() => setPreviewProduct(null)}
            onEdit={null}
            onToggleStock={null}
            onSwipeLeft={(next) => setPreviewProduct(next)}
            onSwipeRight={(prev) => setPreviewProduct(prev)}
          />
        )}
      </main>

      <SideDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        products={products}
        setProducts={setProducts}
        deletedProducts={deletedProducts}
        setDeletedProducts={setDeletedProducts}
        imageMap={globalImageMap}
        selected={[]}
      />

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Delete this item permanently?
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              This action cannot be undone. The item will be permanently removed from your Catalogue.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
