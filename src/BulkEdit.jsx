import React, { useState, useEffect } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";

const FIELD_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "subtitle", label: "Subtitle" },
  { key: "color", label: "Color" },
  { key: "package", label: "Package" },
  { key: "age", label: "Age Group" },
  { key: "wholesale", label: "Wholesale Price" },
  { key: "resell", label: "Resell Price" },
  { key: "badge", label: "Badge" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock Update" },
];

export default function BulkEdit({ products, imageMap, setProducts, onClose, triggerRender }) {
  const [editedData, setEditedData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [step, setStep] = useState("select");
  const [showRenderPopup, setShowRenderPopup] = useState(false);
  const totalProducts = products.length;
const estimatedSeconds = totalProducts * 2; // or whatever estimate you use



useEffect(() => {
  const storedCategories = JSON.parse(localStorage.getItem("categories") || "[]");
  setCategories(storedCategories);

  const normalized = products.map((p) => ({
    ...p,
    wholesaleStock:
      typeof p.wholesaleStock === "boolean"
        ? p.wholesaleStock ? "in" : "out"
        : p.wholesaleStock,
    resellStock:
      typeof p.resellStock === "boolean"
        ? p.resellStock ? "in" : "out"
        : p.resellStock,
  }));

  setEditedData(normalized);
}, [products]);




  const handleFieldChange = (id, field, value) => {
    setEditedData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleCategory = (id, cat) => {
    setEditedData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = Array.isArray(item.category) ? item.category : [];
        return {
          ...item,
          category: current.includes(cat)
            ? current.filter((c) => c !== cat)
            : [...current, cat],
        };
      })
    );
  };

   const handleSave = () => {
  try {
    const cleanData = editedData.map((p) => {
  const copy = { ...p };
  delete copy.image;

  // Convert WS/RS string → boolean
  if (typeof copy.wholesaleStock === "string") {
    copy.wholesaleStock = copy.wholesaleStock === "in";
  }
  if (typeof copy.resellStock === "string") {
    copy.resellStock = copy.resellStock === "in";
  }

  return copy;
});


    localStorage.setItem("products", JSON.stringify(cleanData));
    setProducts(cleanData);
    setShowRenderPopup(true);
  } catch (err) {
    console.error("Save failed:", err);
    alert("Something went wrong during save.");
  }
};

  if (step === "select") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-lg px-4"
      onClick={onClose}
      >
  <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-md"
  onClick={(e) => e.stopPropagation()}
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold text-gray-800">Select Fields to Edit</h2>
      <button onClick={onClose} className="text-2xl text-gray-600 hover:text-red-500">×</button>
    </div>

    <div className="grid grid-cols-2 gap-3 text-gray-700">
      {FIELD_OPTIONS.map((opt) => (
        <label key={opt.key} className="flex items-center gap-3 cursor-pointer text-gray-800">
  <input
    type="checkbox"
    className="appearance-none w-5 h-5 border-2 border-gray-400 rounded-sm checked:bg-blue-600 checked:border-blue-600 transition duration-200"
    checked={selectedFields.includes(opt.key)}
    onChange={(e) => {
      setSelectedFields((prev) =>
        e.target.checked
          ? [...prev, opt.key]
          : prev.filter((k) => k !== opt.key)
      );
    }}
  />
  <span className="text-sm">{opt.label}</span>
</label>
      ))}
    </div>

    <div className="flex justify-end gap-3 mt-6">
      <button
        onClick={() => setStep("edit")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition shadow ${
          selectedFields.length === 0
            ? "bg-blue-400 text-white cursor-not-allowed"
            : "bg-blue-700 text-white hover:bg-blue-800"
        }`}
        disabled={selectedFields.length === 0}
      >
        Continue
      </button>
    </div>
  </div>
</div>

    );
  }
  console.log("imageMap", imageMap);
  return (
  <div className="fixed inset-0 bg-white z-50 flex flex-col">
    <div className="sticky top-0 h-[35px] bg-black z-50"></div>
    <header className="sticky top-[35px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center justify-between gap-3 px-4 relative">
  <h1 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
    🛠️ Bulk Editor
  </h1>
  <button
    onClick={() => setStep("select")}
    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
  >
    <span>✏️</span>
    <span>Edit Fields</span>
  </button>
</header>


    <div className="flex-1 overflow-auto px-4">
        <div className="grid grid-cols-[32px_64px_repeat(auto-fill,minmax(120px,1fr))] gap-2 font-semibold text-xs py-2 border-b">
          <div>#</div>
          <div>Image</div>
          {selectedFields.map((field) => (
            <div key={field}>{FIELD_OPTIONS.find((f) => f.key === field)?.label}</div>
          ))}
        </div>

        {editedData.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[32px_64px_repeat(auto-fill,minmax(120px,1fr))] gap-2 items-center text-sm py-2 border-b"
          >
            <div>{index + 1}</div>
            <div className="w-14 h-14 flex items-center justify-center">
              {imageMap[item.id] ? (
  <img
    src={imageMap[item.id]}
    alt=""
    className="object-contain w-14 h-14 border rounded"
  />
) : (
  <div className="text-gray-400 text-xs">No Image</div>
)}


            </div>

            {selectedFields.includes("name") && (
              <input
                value={item.name || ""}
                onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("subtitle") && (
              <input
                value={item.subtitle || ""}
                onChange={(e) => handleFieldChange(item.id, "subtitle", e.target.value)}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("color") && (
              <input
                value={item.color || ""}
                onChange={(e) => handleFieldChange(item.id, "color", e.target.value)}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("package") && (
  <div className="flex gap-2">
    <input
      value={item.package || ""}
      onChange={(e) => handleFieldChange(item.id, "package", e.target.value)}
      className="border rounded px-2 py-1 w-full"
    />
    <select
      value={item.packageUnit || ""}
      onChange={(e) => handleFieldChange(item.id, "packageUnit", e.target.value)}
      className="border rounded px-2 py-1 min-w-[75px]"
    >
      <option value="pcs / set">pcs / set</option>
      <option value="pcs / dozen">pcs / dozen</option>
      <option value="pcs / pack">pcs / pack</option>
    </select>
  </div>
)}


            {selectedFields.includes("age") && (
              <div className="flex gap-2">
                <input
                  value={item.age || ""}
                  onChange={(e) => handleFieldChange(item.id, "age", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
                <select
                  value={item.ageUnit || ""}
                  onChange={(e) => handleFieldChange(item.id, "ageUnit", e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="months">months</option>
                  <option value="years">years</option>
                  <option value="Newborn">Newborn</option>
                </select>
              </div>
            )}

            {selectedFields.includes("wholesale") && (
              <div className="flex gap-2">
                <input
                  value={item.wholesale || ""}
                  onChange={(e) => handleFieldChange(item.id, "wholesale", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
                <select
                  value={item.wholesaleUnit || ""}
                  onChange={(e) => handleFieldChange(item.id, "wholesaleUnit", e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="/ piece">/ piece</option>
                  <option value="/ dozen">/ dozen</option>
                  <option value="/ set">/ set</option>
                </select>
              </div>
            )}

            {selectedFields.includes("resell") && (
              <div className="flex gap-2">
                <input
                  value={item.resell || ""}
                  onChange={(e) => handleFieldChange(item.id, "resell", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
                <select
                  value={item.resellUnit || ""}
                  onChange={(e) => handleFieldChange(item.id, "resellUnit", e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="/ piece">/ piece</option>
                  <option value="/ dozen">/ dozen</option>
                  <option value="/ set">/ set</option>
                </select>
              </div>
            )}

            {selectedFields.includes("badge") && (
              <div className="flex items-center gap-1">
                <input
                  value={item.badge || ""}
                  onChange={(e) => handleFieldChange(item.id, "badge", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
                <button
                  onClick={() =>
                    handleFieldChange(item.id, "badge", item.badge === "Muslin" ? "" : "Muslin")
                  }
                  className={`px-2 py-1 text-xs rounded ${item.badge === "Muslin" ? "bg-purple-600 text-white" : "bg-gray-200 text-black"}`}
                >
                  Muslin
                </button>
              </div>
            )}

            {selectedFields.includes("category") && (
  <div className="col-span-full">
    <div
      className="flex flex-wrap gap-2 overflow-hidden"
      style={{
        maxHeight: "4.5rem", // ~2 lines at 36px per line
        lineHeight: "1rem",  // tighter spacing
      }}
    >
      {categories.map((cat) => (
        <div
          key={cat}
          onClick={() => toggleCategory(item.id, cat)}
          className={`px-3 py-1 rounded-full text-xs cursor-pointer transition border ${
            Array.isArray(item.category) && item.category.includes(cat)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-100 text-gray-700 border-gray-300"
          }`}
        >
          {cat}
        </div>
      ))}
    </div>
  </div>
)}

{selectedFields.includes("stock") && (
  <div className="flex gap-2">
    <button
      onClick={() =>
        handleFieldChange(item.id, "wholesaleStock", item.wholesaleStock === "in" ? "out" : "in")
      }
      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
        item.wholesaleStock === "in"
          ? "bg-green-600 text-white"
          : "bg-gray-300 text-gray-800"
      }`}
    >
      WS: {item.wholesaleStock === "in" ? "In" : "Out"}
    </button>
    <button
      onClick={() =>
        handleFieldChange(item.id, "resellStock", item.resellStock === "in" ? "out" : "in")
      }
      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
        item.resellStock === "in"
          ? "bg-yellow-600 text-white"
          : "bg-gray-300 text-gray-800"
      }`}
    >
      RS: {item.resellStock === "in" ? "In" : "Out"}
    </button>
  </div>
)}


          </div>
        ))}
      </div>

      <div className="shrink-0 bg-white border-t shadow-md flex justify-end gap-3 px-4 py-3 z-20">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-300 text-sm rounded"
      >
        Cancel
      </button>
       <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
        >
          Save Changes
        </button>
      </div>
      {showRenderPopup && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50 flex items-center justify-center px-4">
    <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Render PNGs?</h2>

      <p className="text-sm text-gray-600 mb-2">
        Your changes are saved. Would you like to render PNGs now?
      </p>

      <p className="text-sm text-gray-600 mb-4">
        Estimated time: <span className="font-semibold">{estimatedSeconds}</span> sec for {totalProducts} products
      </p>

      <div className="flex justify-center gap-4 pb-[env(safe-area-inset-bottom)]">
        <button
          className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-sm"
          onClick={() => {
            setShowRenderPopup(false);
            triggerRender?.();
            setTimeout(onClose, 100);
          }}
        >
          Continue
        </button>

        <button
          className="px-5 py-2 rounded-full bg-gray-300 text-gray-800 font-medium shadow hover:bg-gray-400 transition text-sm"
          onClick={() => {
    setShowRenderPopup(false);
    onClose(); // ✅ Close the Bulk Editor
  }}
        >
          Maybe later
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
