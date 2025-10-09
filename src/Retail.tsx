import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FiSettings, FiPlus } from "react-icons/fi";
import Cropper from "react-easy-crop";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCroppedImg } from "./cropUtils";
import { getPalette } from "./colorUtils";

export default function Retail({ products = [] }) {
  const navigate = useNavigate();
  const [retailProducts, setRetailProducts] = useState(() =>
    JSON.parse(localStorage.getItem("retailProducts") || "[]")
  );
  const [markupPercent, setMarkupPercent] = useState(() =>
    parseFloat(localStorage.getItem("retailMarkupPercent") || "30")
  );

  const [showSettings, setShowSettings] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [selectedToPull, setSelectedToPull] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    localStorage.setItem("retailProducts", JSON.stringify(retailProducts));
  }, [retailProducts]);

  useEffect(() => {
    localStorage.setItem("retailMarkupPercent", String(markupPercent));
  }, [markupPercent]);

  const openPull = () => {
    setSelectedToPull([]);
    setShowPullModal(true);
  };

  const toggleSelectToPull = (id) => {
    setSelectedToPull((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const importSelected = () => {
    const toImport = products.filter((p) => selectedToPull.includes(p.id));
    const copies = toImport.map((p) => {
      const wholesale = Number(p.wholesale || p.wholesalePrice || 0) || 0;
      const retailPrice = Math.round(wholesale + (wholesale * markupPercent) / 100);
      return {
        id: uuidv4(),
        sourceId: p.id,
        name: p.name || "",
        subtitle: p.subtitle || "",
        wholesale: wholesale,
        retail: retailPrice,
        image: p.image || p.imagePath || "",
        category: p.category || [],
        note: p.note || "",
      };
    });

    setRetailProducts((prev) => [...copies, ...prev]);
    setShowPullModal(false);
  };

  const saveEditedProduct = () => {
    setRetailProducts((prev) => prev.map((p) => (p.id === editingId ? editingProduct : p)));
    setEditingId(null);
    setEditingProduct(null);
  };

  const addEmptyProduct = () => {
    const p = {
      id: uuidv4(),
      name: "New Product",
      subtitle: "",
      wholesale: 0,
      retail: 0,
      image: "",
      category: [],
      note: "",
    };
    setRetailProducts((prev) => [p, ...prev]);
    setEditingId(p.id);
    setEditingProduct(p);
  };

  const updateMarkup = (val) => {
    const n = Number(val);
    if (Number.isNaN(n)) return;
    setMarkupPercent(n);
  };

  return (
    <div className="w-full min-h-[100dvh] bg-gradient-to-b from-white to-gray-100 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-screen h-[40px] bg-black z-50" />
      <header className="fixed top-[40px] left-1/2 -translate-x-1/2 w-screen z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate(-1)}
          className="relative w-8 h-8 shrink-0 flex items-center justify-center text-gray-700"
          title="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-bold truncate">Retail</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowSettings(true)}
          className="text-xl text-gray-600 hover:text-black"
          title="Settings"
        >
          <FiSettings />
        </button>
      </header>

      <main className="pt-[calc(40px+56px)] px-4 pb-28">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={openPull}
              className="px-3 py-2 bg-blue-600 text-white rounded-md"
            >
              Pull from Products
            </button>
            <button
              onClick={addEmptyProduct}
              className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
            >
              <FiPlus /> Add Product
            </button>
          </div>
          <div className="text-sm text-gray-600">Default markup: {markupPercent}%</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {retailProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-3">
              <div className="relative aspect-square overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-gray-500 truncate mb-2">{p.subtitle}</div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Wholesale</div>
                  <div className="font-medium">₹{p.wholesale}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Retail</div>
                  <div className="font-medium">₹{p.retail}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditingProduct({ ...p });
                  }}
                  className="px-2 py-1 text-sm bg-gray-100 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => setRetailProducts((prev) => prev.filter((x) => x.id !== p.id))}
                  className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-3">Pull products from Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-auto mb-3">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-2 border rounded">
                  <input type="checkbox" checked={selectedToPull.includes(p.id)} onChange={() => toggleSelectToPull(p.id)} />
                  <img src={p.image || p.imagePath || ""} alt="" className="w-12 h-12 object-cover rounded bg-gray-100" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">Wholesale: ₹{p.wholesale || 0}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm mr-2">Markup %</label>
                <input type="number" className="w-20 px-2 py-1 border rounded" value={markupPercent} onChange={(e) => updateMarkup(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowPullModal(false)} className="px-3 py-2 rounded bg-gray-200">Cancel</button>
                <button onClick={importSelected} className="px-3 py-2 rounded bg-blue-600 text-white">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-3">Retail Settings</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Default markup %</label>
              <input type="number" className="w-full px-3 py-2 border rounded" value={markupPercent} onChange={(e) => updateMarkup(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSettings(false)} className="px-3 py-2 rounded bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {editingId && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Edit product</h3>
            <div className="grid grid-cols-1 gap-3">
              <label>
                <div className="text-sm text-gray-700">Name</div>
                <input className="w-full px-3 py-2 border rounded" value={editingProduct.name} onChange={(e) => setEditingProduct((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <label>
                <div className="text-sm text-gray-700">Subtitle</div>
                <input className="w-full px-3 py-2 border rounded" value={editingProduct.subtitle} onChange={(e) => setEditingProduct((s) => ({ ...s, subtitle: e.target.value }))} />
              </label>
              <label>
                <div className="text-sm text-gray-700">Wholesale (₹)</div>
                <input type="number" className="w-full px-3 py-2 border rounded" value={editingProduct.wholesale} onChange={(e) => setEditingProduct((s) => ({ ...s, wholesale: Number(e.target.value) }))} />
              </label>
              <label>
                <div className="text-sm text-gray-700">Retail (₹)</div>
                <input type="number" className="w-full px-3 py-2 border rounded" value={editingProduct.retail} onChange={(e) => setEditingProduct((s) => ({ ...s, retail: Number(e.target.value) }))} />
              </label>
              <label>
                <div className="text-sm text-gray-700">Image URL</div>
                <input className="w-full px-3 py-2 border rounded" value={editingProduct.image} onChange={(e) => setEditingProduct((s) => ({ ...s, image: e.target.value }))} />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setEditingId(null); setEditingProduct(null); }} className="px-3 py-2 rounded bg-gray-200">Cancel</button>
              <button onClick={saveEditedProduct} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
