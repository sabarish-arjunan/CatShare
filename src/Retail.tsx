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

  const getLighterColor = (color) => {
    try {
      if (typeof color === 'string' && color.startsWith('#') && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const lighten = (c) => Math.min(255, c + 40);
        return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
      }
      const rgbMatch = String(color).match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        const lighten = (c) => Math.min(255, c + 40);
        return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
      }
    } catch (err) {
      return color;
    }
    return color;
  };

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

  const [imageMap, setImageMap] = useState({});

  useEffect(() => {
    // preload images for retailProducts
    (async () => {
      const map = {};
      for (const p of retailProducts) {
        try {
          if (p.image && typeof p.image === "string") {
            if (p.image.startsWith("data:image")) {
              map[p.id] = p.image;
            } else if (p.image.startsWith("retail/") || p.image.startsWith("catalogue/")) {
              try {
                const res = await Filesystem.readFile({ path: p.image, directory: Directory.Data });
                map[p.id] = `data:image/png;base64,${res.data}`;
              } catch (err) {
                // cannot read file (web), try to use as-is
                map[p.id] = p.image;
              }
            } else {
              // unknown string, try as URL
              map[p.id] = p.image;
            }
          }
        } catch (err) {
          console.warn("Retail image preload failed:", err);
        }
      }
      setImageMap(map);
    })();
  }, [retailProducts]);

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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 select-none" id="retail-capture-area">
          {retailProducts.map((p) => (
            <div key={p.id} className={`share-card bg-white rounded-sm shadow-sm overflow-hidden relative cursor-pointer transition-all duration-200`}>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {imageMap[p.id] ? (
                  <img src={imageMap[p.id]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}

                <div className="absolute top-1 right-1 flex gap-1 z-10">
                  <button onClick={async (e) => { e.stopPropagation(); setEditingId(p.id); setEditingProduct({ ...p }); try { if (p.image && typeof p.image === 'string' && p.image.startsWith('retail/')) { const res = await Filesystem.readFile({ path: p.image, directory: Directory.Data }); setImagePreview(`data:image/png;base64,${res.data}`); } else if (p.image && p.image.startsWith('data:image')) { setImagePreview(p.image); } else { setImagePreview(null); } } catch (err) { console.warn('Failed to read image for edit:', err); setImagePreview(null); } }} className="w-8 h-8 bg-white/90 rounded flex items-center justify-center shadow text-sm">✎</button>
                  <button onClick={(e) => { e.stopPropagation(); setRetailProducts((prev) => prev.filter((x) => x.id !== p.id)); }} className="w-8 h-8 bg-white/90 rounded flex items-center justify-center shadow text-sm text-red-600">🗑️</button>
                </div>
              </div>

              {showInfo && (
                <div className="absolute top-1.5 right-1.5 bg-red-800 text-white text-[11px] font-medium px-2 py-0.45 rounded-full shadow-md tracking-wide z-10">
                  ₹{p.retail}
                </div>
              )}

              <div className="px-1 py-1 text-center font-medium text-[11px] truncate">{p.name}</div>

            </div>
          ))}
        </div>

        {/* preload images for retail products */}
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
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="h-full w-full max-w-4xl mx-auto bg-white overflow-auto" style={{ paddingTop: '56px' }}>
            <div className="fixed top-0 left-0 right-0 h-[40px] bg-black z-50" />
            <header className="fixed top-[40px] left-1/2 -translate-x-1/2 w-full max-w-4xl z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditingId(null); setEditingProduct(null); setImagePreview(null); setCropping(false); }} className="w-8 h-8 flex items-center justify-center">←</button>
                <h1 className="text-lg font-semibold">{editingProduct.name || 'Edit Product'}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSelectImage} className="text-sm px-3 py-1 bg-gray-100 rounded">Choose Image</button>
                <button onClick={async () => {
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
            </header>

            <div className="px-4 pb-10">
              <div className="mb-4">
                <input type="file" id="retail-fallback-file-input" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </div>

              {cropping && imagePreview && (
                <div className="mb-4">
                  <div style={{ height: 360, position: 'relative' }}>
                    <Cropper image={imagePreview} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                  </div>
                  <div className="flex gap-4 mt-2 justify-center">
                    <button onClick={applyCrop} className="bg-blue-500 text-white px-4 py-1 rounded">Apply Crop</button>
                    <button onClick={() => setCropping(false)} className="bg-gray-300 px-4 py-1 rounded">Cancel</button>
                  </div>
                </div>
              )}

              {!cropping && (
                <>
                  <div className="max-w-2xl mx-auto">
                    <div className="mb-3">
                      <input className="border p-2 rounded w-full mb-2" placeholder="Model Name" value={editingProduct.name} onChange={(e) => setEditingProduct((s) => ({ ...s, name: e.target.value }))} />
                      <input className="border p-2 rounded w-full mb-2" placeholder="Subtitle" value={editingProduct.subtitle} onChange={(e) => setEditingProduct((s) => ({ ...s, subtitle: e.target.value }))} />
                      <div className="flex gap-2 mb-2">
                        <input name="wholesale" value={editingProduct.wholesale} onChange={(e) => setEditingProduct((s) => ({ ...s, wholesale: Number(e.target.value) }))} placeholder="Wholesale Price" className="border p-2 w-full rounded" />
                        <input name="retail" value={editingProduct.retail} onChange={(e) => setEditingProduct((s) => ({ ...s, retail: Number(e.target.value) }))} placeholder="Retail Price" className="border p-2 w-full rounded" />
                      </div>

                      <div className="flex gap-2 mb-2">
                        <input className="border p-2 w-full rounded" placeholder="Package" value={editingProduct.package || ''} onChange={(e) => setEditingProduct((s) => ({ ...s, package: e.target.value }))} />
                        <input className="border p-2 w-full rounded" placeholder="Age Group" value={editingProduct.age || ''} onChange={(e) => setEditingProduct((s) => ({ ...s, age: e.target.value }))} />
                      </div>

                      <label className="block text-sm font-medium mb-1">Product Badge</label>
                      <div className="flex gap-2 mb-3">
                        <input className="border p-2 rounded text-sm" value={editingProduct.badge || ''} onChange={(e) => setEditingProduct((s) => ({ ...s, badge: e.target.value }))} />
                      </div>

                      <div className="mb-3">
                        <label className="block mb-1 font-semibold">Categories</label>
                        <input className="w-full px-3 py-2 border rounded" placeholder="comma separated" value={(editingProduct.category || []).join(', ')} onChange={(e) => setEditingProduct((s) => ({ ...s, category: e.target.value.split(',').map(x=>x.trim()).filter(Boolean) }))} />
                      </div>

                      <div className="my-3">
                        <label className="block mb-1 font-semibold">Override BG:</label>
                        <input type="color" value={overrideColor} onChange={(e) => setOverrideColor(e.target.value)} />
                      </div>

                      <div className="flex gap-4 mb-4">
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

                      {/* Preview */}
                      <div id="catalogue-preview" className="mt-6 border rounded shadow overflow-hidden" style={{ maxWidth: 330, width: '100%' }}>
                        <div style={{ backgroundColor: overrideColor, color: fontColor, padding: 8, textAlign: 'center', fontWeight: 'normal', fontSize: 19 }}>
                          Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{editingProduct.wholesale} / piece
                        </div>

                        {imagePreview && (
                          <div style={{ position: 'relative', backgroundColor: imageBgOverride, textAlign: 'center', padding: 10, boxShadow: '0 12px 15px -6px rgba(0, 0, 0, 0.4)' }}>
                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', margin: '0 auto' }} />
                          </div>
                        )}

                        <div style={{ backgroundColor: getLighterColor ? getLighterColor(overrideColor) : overrideColor, color: fontColor, padding: 10 }}>
                          <h2 className="text-lg font-semibold text-center">{editingProduct.name}</h2>
                          {editingProduct.subtitle && <p className="text-center italic text-sm">({editingProduct.subtitle})</p>}
                          <div className="text-sm mt-2 space-y-1">
                            <p>Colour&nbsp;&nbsp;: {editingProduct.color || ''}</p>
                            <p>Package&nbsp;: {editingProduct.package || ''}</p>
                            <p>Age Group&nbsp;: {editingProduct.age || ''}</p>
                          </div>
                        </div>

                        <div style={{ backgroundColor: overrideColor, color: fontColor, padding: 8, textAlign: 'center', fontWeight: 'normal', fontSize: 19 }}>
                          Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{editingProduct.retail} / piece
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
