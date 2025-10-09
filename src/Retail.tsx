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

  // image / crop states
  const [imagePreview, setImagePreview] = useState(null);
  const [originalBase64, setOriginalBase64] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [overrideColor, setOverrideColor] = useState("#d1b3c4");
  const [fontColor, setFontColor] = useState("white");
  const [imageBgOverride, setImageBgOverride] = useState("white");
  const [suggestedColors, setSuggestedColors] = useState([]);

  const onCropComplete = useCallback((_, areaPixels) => setCroppedAreaPixels(areaPixels), []);

  const handleSelectImage = async () => {
    const defaultFolder = "Phone/Pictures/Photoroom";
    const folder = localStorage.getItem("lastUsedFolder") || defaultFolder;

    try {
      const res = await Filesystem.readdir({ path: folder, directory: Directory.External });
      const imageFile = res.files.find((f) => f.name.match(/\.(jpg|jpeg|png|webp)$/i));
      if (!imageFile) throw new Error("No image files found in folder");

      const fullPath = `${folder}/${imageFile.name}`;
      const fileData = await Filesystem.readFile({ path: fullPath, directory: Directory.External });
      const base64 = `data:image/png;base64,${fileData.data}`;
      setOriginalBase64(base64);
      setImagePreview(base64);
      setCropping(true);
      localStorage.setItem("lastUsedFolder", folder);
    } catch (err) {
      console.warn("Fallback to system file picker:", err.message);
      document.getElementById("retail-fallback-file-input").click();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        if (file.webkitRelativePath || file.name) {
          const fakePath = file.webkitRelativePath || file.name;
          const folderPath = fakePath.substring(0, fakePath.lastIndexOf("/"));
          localStorage.setItem("lastUsedFolder", folderPath);
        }
        setOriginalBase64(base64Data);
        setImagePreview(base64Data);
        setCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = async () => {
    if (!imagePreview || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imagePreview, croppedAreaPixels);
      setImagePreview(croppedBase64);
      setCropping(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  useEffect(() => {
    if (imagePreview) {
      const img = new Image();
      img.src = imagePreview;
      img.onload = () => {
        const palette = getPalette(img, 12);
        setSuggestedColors(palette);
      };
    }
  }, [imagePreview]);

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

            {/* Image picker */}
            <div className="mb-3">
              <button
                onClick={handleSelectImage}
                className="group relative bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose Image
              </button>

              <input
                type="file"
                id="retail-fallback-file-input"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>

            {cropping && imagePreview && (
              <div className="mb-4">
                <div style={{ height: 300, position: "relative" }}>
                  <Cropper
                    image={imagePreview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex gap-4 mt-2 justify-center">
                  <button onClick={applyCrop} className="bg-blue-500 text-white px-4 py-1 rounded">Apply Crop</button>
                  <button onClick={() => setCropping(false)} className="bg-gray-300 px-4 py-1 rounded">Cancel</button>
                </div>
              </div>
            )}

            {!cropping && (
              <div className="grid grid-cols-1 gap-3">
                <label>
                  <div className="text-sm text-gray-700">Name</div>
                  <input className="w-full px-3 py-2 border rounded" value={editingProduct.name} onChange={(e) => setEditingProduct((s) => ({ ...s, name: e.target.value }))} />
                </label>

                <label>
                  <div className="text-sm text-gray-700">Subtitle</div>
                  <input className="w-full px-3 py-2 border rounded" value={editingProduct.subtitle} onChange={(e) => setEditingProduct((s) => ({ ...s, subtitle: e.target.value }))} />
                </label>

                <div className="flex gap-2">
                  <label className="flex-1">
                    <div className="text-sm text-gray-700">Wholesale (₹)</div>
                    <input type="number" className="w-full px-3 py-2 border rounded" value={editingProduct.wholesale} onChange={(e) => setEditingProduct((s) => ({ ...s, wholesale: Number(e.target.value) }))} />
                  </label>

                  <label className="flex-1">
                    <div className="text-sm text-gray-700">Retail (₹)</div>
                    <input type="number" className="w-full px-3 py-2 border rounded" value={editingProduct.retail} onChange={(e) => setEditingProduct((s) => ({ ...s, retail: Number(e.target.value) }))} />
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="text-sm text-gray-700">Badge</div>
                  <input className="px-3 py-2 border rounded flex-1" value={editingProduct.badge || ""} onChange={(e) => setEditingProduct((s) => ({ ...s, badge: e.target.value }))} />
                </div>

                <div className="my-2">
                  <label className="block mb-1 font-semibold">Categories</label>
                  <input className="w-full px-3 py-2 border rounded" placeholder="comma separated" value={(editingProduct.category || []).join(', ')} onChange={(e) => setEditingProduct((s) => ({ ...s, category: e.target.value.split(',').map(x=>x.trim()).filter(Boolean) }))} />
                </div>

                <div className="my-3">
                  <label className="block mb-1 font-semibold">Override BG:</label>
                  <input type="color" value={overrideColor} onChange={(e) => setOverrideColor(e.target.value)} />
                </div>

                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium">Font Color</label>
                    <div className="flex gap-2 mt-1">
                      {['white','black'].map(color=> (
                        <div key={color} onClick={() => setFontColor(color)} style={{ width:28, height:28, backgroundColor: color, border: fontColor===color ? '3px solid black' : '1px solid #ccc', borderRadius: '100%', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Image BG</label>
                    <div className="flex gap-2 mt-1">
                      {['white','black'].map(color=> (
                        <div key={color} onClick={() => setImageBgOverride(color)} style={{ width:28, height:28, backgroundColor: color, border: imageBgOverride===color ? '3px solid black' : '1px solid #ccc', borderRadius: '100%', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => { setEditingId(null); setEditingProduct(null); setImagePreview(null); setCropping(false); }} className="px-3 py-2 rounded bg-gray-200">Cancel</button>
                  <button onClick={async () => {
                    // save image if any
                    try {
                      const id = editingId;
                      let imagePath = editingProduct.image || '';
                      if (imagePreview && imagePreview.startsWith('data:image')) {
                        const base64 = imagePreview.split(',')[1];
                        imagePath = `retail/product-${id}.png`;
                        await Filesystem.writeFile({ path: imagePath, data: base64, directory: Directory.Data, recursive: true });
                      }
                      setRetailProducts(prev => prev.map(p => p.id===id ? { ...editingProduct, image: imagePath } : p));
                      setEditingId(null);
                      setEditingProduct(null);
                      setImagePreview(null);
                    } catch (err) {
                      alert('Image save failed: ' + err.message);
                    }
                  }} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
