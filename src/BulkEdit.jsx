import React, { useState, useEffect } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { useToast } from "./context/ToastContext";
import { getCatalogueData, setCatalogueData, isProductEnabledForCatalogue } from "./config/catalogueProductUtils";
import { getAllCatalogues } from "./config/catalogueConfig";

const getFieldOptions = (catalogueId, priceField, priceUnitField) => {
  const baseFields = [
    { key: "name", label: "Name" },
    { key: "subtitle", label: "Subtitle" },
    { key: "field1", label: "Colour" },
    { key: "field2", label: "Package" },
    { key: "field3", label: "Age Group" },
    { key: "badge", label: "Badge" },
    { key: "category", label: "Category" },
  ];

  // Add price field based on catalogue
  if (priceField) {
    baseFields.push({ key: priceField, label: 'Price' });
  }

  baseFields.push({ key: "stock", label: "Stock Update" });
  return baseFields;
};

export default function BulkEdit({ products, allProducts, imageMap, setProducts, onClose, triggerRender, catalogueId: initialCatalogueId, priceField: initialPriceField, priceUnitField: initialPriceUnitField, stockField: initialStockField }) {
  const [editedData, setEditedData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [step, setStep] = useState(initialCatalogueId ? "select" : "catalogue");
  const [showRenderPopup, setShowRenderPopup] = useState(false);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState(initialCatalogueId || null);
  const [selectedCatalogueConfig, setSelectedCatalogueConfig] = useState(null);
  const [catalogues, setCatalogues] = useState([]);
  const [filledFromMaster, setFilledFromMaster] = useState({}); // Track which fields are filled from master
  const { showToast } = useToast();

  // Use initial values or selected values
  const catalogueId = selectedCatalogueId || initialCatalogueId;
  const priceField = selectedCatalogueConfig?.priceField || initialPriceField;
  const priceUnitField = selectedCatalogueConfig?.priceUnitField || initialPriceUnitField;
  const stockField = selectedCatalogueConfig?.stockField || initialStockField;

  const totalProducts = products.length;
  const estimatedSeconds = totalProducts * 2; // or whatever estimate you use
  const FIELD_OPTIONS = getFieldOptions(catalogueId, priceField, priceUnitField);

  // Load catalogues on mount
  useEffect(() => {
    const cats = getAllCatalogues();
    setCatalogues(cats);
  }, []);



useEffect(() => {
  const storedCategories = JSON.parse(localStorage.getItem("categories") || "[]");
  setCategories(storedCategories);

  const normalized = products.map((p) => {
    // Check if this is a new catalogue (different from initial)
    const isNewCatalogue = catalogueId && initialCatalogueId && catalogueId !== initialCatalogueId;

    const normalized = {
      ...p,
      // Initialize all fields with defaults to avoid uncontrolled input warnings
      name: p.name || "",
      subtitle: p.subtitle || "",
      badge: p.badge || "",
      category: p.category || [],
      // For new catalogues, start with empty fields; for existing catalogues, use their data
      field1: isNewCatalogue ? "" : (p.field1 || p.color || ""),
      color: isNewCatalogue ? "" : (p.field1 || p.color || ""),
      field2: isNewCatalogue ? "" : (p.field2 || p.package || ""),
      field2Unit: isNewCatalogue ? "pcs / set" : (p.field2Unit || p.packageUnit || "pcs / set"),
      package: isNewCatalogue ? "" : (p.field2 || p.package || ""),
      packageUnit: isNewCatalogue ? "pcs / set" : (p.field2Unit || p.packageUnit || "pcs / set"),
      field3: isNewCatalogue ? "" : (p.field3 || p.age || ""),
      field3Unit: isNewCatalogue ? "months" : (p.field3Unit || p.ageUnit || "months"),
      age: isNewCatalogue ? "" : (p.field3 || p.age || ""),
      ageUnit: isNewCatalogue ? "months" : (p.field3Unit || p.ageUnit || "months"),
      wholesaleStock:
        typeof p.wholesaleStock === "boolean"
          ? p.wholesaleStock ? "in" : "out"
          : p.wholesaleStock || "",
      resellStock:
        typeof p.resellStock === "boolean"
          ? p.resellStock ? "in" : "out"
          : p.resellStock || "",
    };

    // Handle catalogue-specific stock field
    if (stockField && stockField !== 'wholesaleStock' && stockField !== 'resellStock') {
      normalized[stockField] = typeof p[stockField] === "boolean"
        ? p[stockField] ? "in" : "out"
        : (p[stockField] || "");
    }

    // Add price field for the current catalogue - start empty for new catalogues
    if (priceField) {
      normalized[priceField] = isNewCatalogue ? "" : (p[priceField] || "");
      normalized[priceUnitField] = isNewCatalogue ? "/ piece" : (p[priceUnitField] || "/ piece");
    }

    // Initialize other price fields to avoid uncontrolled input warnings
    normalized.wholesale = p.wholesale || "";
    normalized.wholesaleUnit = p.wholesaleUnit || "/ piece";
    normalized.resell = p.resell || "";
    normalized.resellUnit = p.resellUnit || "/ piece";
    normalized.retail = p.retail || "";
    normalized.retailUnit = p.retailUnit || "/ piece";
    normalized.stock = p.stock || "";

    return normalized;
  });

  setEditedData(normalized.map(item => ensureFieldDefaults(item)));
}, [products, stockField, catalogueId, priceField, priceUnitField, initialCatalogueId]);




  // Ensure all fields have proper defaults
  const ensureFieldDefaults = (item) => {
    return {
      id: item.id,
      name: item.name ?? "",
      subtitle: item.subtitle ?? "",
      badge: item.badge ?? "",
      category: item.category ?? [],
      field1: item.field1 ?? "",
      color: item.color ?? "",
      field2: item.field2 ?? "",
      field2Unit: item.field2Unit ?? "pcs / set",
      package: item.package ?? "",
      packageUnit: item.packageUnit ?? "pcs / set",
      field3: item.field3 ?? "",
      field3Unit: item.field3Unit ?? "months",
      age: item.age ?? "",
      ageUnit: item.ageUnit ?? "months",
      wholesale: item.wholesale ?? "",
      wholesaleUnit: item.wholesaleUnit ?? "/ piece",
      resell: item.resell ?? "",
      resellUnit: item.resellUnit ?? "/ piece",
      retail: item.retail ?? "",
      retailUnit: item.retailUnit ?? "/ piece",
      wholesaleStock: item.wholesaleStock ?? "",
      resellStock: item.resellStock ?? "",
      stock: item.stock ?? "",
      image: item.image ?? "",
      imagePath: item.imagePath ?? "",
      ...item, // Keep any other properties
    };
  };

  const handleFieldChange = (id, field, value) => {
    setEditedData((prev) =>
      prev.map((item) => (item.id === id ? ensureFieldDefaults({ ...item, [field]: value }) : item))
    );
  };

  const toggleFillFromMaster = (fieldKey) => {
    const newState = !filledFromMaster[fieldKey];
    setFilledFromMaster((prev) => ({ ...prev, [fieldKey]: newState }));

    if (newState) {
      // Fill from master catalogue for all products
      const masterCatalogueId = catalogues[0]?.id; // Get the first catalogue (Master)
      if (!masterCatalogueId) return;

      setEditedData((prev) =>
        prev.map((item) => {
          const masterData = getCatalogueData(item, masterCatalogueId);
          const updates = {};

          if (fieldKey === "field1") {
            updates.field1 = masterData.field1 || item.color || "";
          } else if (fieldKey === "field2") {
            updates.field2 = masterData.field2 || item.package || "";
            updates.field2Unit = masterData.field2Unit || item.packageUnit || "pcs / set";
          } else if (fieldKey === "field3") {
            updates.field3 = masterData.field3 || item.age || "";
            updates.field3Unit = masterData.field3Unit || item.ageUnit || "months";
          } else if (fieldKey === priceField) {
            updates[priceField] = masterData[priceField] || "";
            updates[priceUnitField] = masterData[priceUnitField] || "/ piece";
          }

          return ensureFieldDefaults({ ...item, ...updates });
        })
      );
    } else {
      // Empty the field for all products
      setEditedData((prev) =>
        prev.map((item) => {
          const updates = {};

          if (fieldKey === "field1") {
            updates.field1 = "";
          } else if (fieldKey === "field2") {
            updates.field2 = "";
            updates.field2Unit = "pcs / set";
          } else if (fieldKey === "field3") {
            updates.field3 = "";
            updates.field3Unit = "months";
          } else if (fieldKey === priceField) {
            updates[priceField] = "";
            updates[priceUnitField] = "/ piece";
          }

          return ensureFieldDefaults({ ...item, ...updates });
        })
      );
    }
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
  let copy = { ...p };
  // Preserve image field to maintain product-to-image associations

  // Convert stock fields from string → boolean
  if (typeof copy.wholesaleStock === "string") {
    copy.wholesaleStock = copy.wholesaleStock === "in";
  }
  if (typeof copy.resellStock === "string") {
    copy.resellStock = copy.resellStock === "in";
  }

  // Handle catalogue-specific stock field
  if (stockField && stockField !== 'wholesaleStock' && stockField !== 'resellStock') {
    if (typeof copy[stockField] === "string") {
      copy[stockField] = copy[stockField] === "in";
    }
  }

  // Save catalogue-specific data
  copy = setCatalogueData(copy, catalogueId, {
    field1: p.field1,
    field2: p.field2,
    field3: p.field3,
    field2Unit: p.field2Unit,
    field3Unit: p.field3Unit,
    [priceField]: priceField ? p[priceField] : undefined,
    [priceUnitField]: priceField ? p[priceUnitField] : undefined,
    [stockField]: stockField ? (typeof p[stockField] === "string" ? p[stockField] === "in" : p[stockField]) : undefined,
  });

  return copy;
});

    // Merge edited products back into allProducts to preserve products not in this catalogue
    const editedIds = new Set(cleanData.map(p => p.id));
    const mergedData = allProducts ? allProducts.map(p =>
      editedIds.has(p.id) ? cleanData.find(edited => edited.id === p.id) : p
    ) : cleanData;

    localStorage.setItem("products", JSON.stringify(mergedData));
    setProducts(mergedData);
    setShowRenderPopup(true);
  } catch (err) {
    console.error("Save failed:", err);
    showToast("Something went wrong during save.", "error");
  }
};

  // Catalogue selection step
  if (step === "catalogue") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-lg px-4"
      onClick={onClose}
      >
  <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-md"
  onClick={(e) => e.stopPropagation()}
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold text-gray-800">Select Catalogue to Edit</h2>
      <button onClick={onClose} className="text-2xl text-gray-600 hover:text-red-500">×</button>
    </div>

    <div className="space-y-2 text-gray-700">
      {catalogues.map((cat) => {
        // Filter products for this catalogue
        const productsForCat = allProducts ? allProducts.filter(p => isProductEnabledForCatalogue(p, cat.id)) : [];

        return (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCatalogueId(cat.id);
              setSelectedCatalogueConfig(cat);

              // Filter products to show only those enabled for this catalogue
              if (allProducts) {
                const filtered = allProducts.filter(p => isProductEnabledForCatalogue(p, cat.id));
                // Update editedData with filtered products
                const normalized = filtered.map((p) => {
                  const catData = getCatalogueData(p, cat.id);
                  const normalized = {
                    ...p,
                    field1: catData.field1 || p.field1 || p.color || "",
                    field2: catData.field2 || p.field2 || p.package || "",
                    field2Unit: catData.field2Unit || p.field2Unit || p.packageUnit || "pcs / set",
                    field3: catData.field3 || p.field3 || p.age || "",
                    field3Unit: catData.field3Unit || p.field3Unit || p.ageUnit || "months",
                    wholesaleStock: typeof p.wholesaleStock === "boolean" ? p.wholesaleStock ? "in" : "out" : p.wholesaleStock,
                    resellStock: typeof p.resellStock === "boolean" ? p.resellStock ? "in" : "out" : p.resellStock,
                  };

                  if (cat.stockField && cat.stockField !== 'wholesaleStock' && cat.stockField !== 'resellStock') {
                    normalized[cat.stockField] = typeof p[cat.stockField] === "boolean" ? p[cat.stockField] ? "in" : "out" : p[cat.stockField];
                  }

                  if (cat.priceField) {
                    normalized[cat.priceField] = catData[cat.priceField] || p[cat.priceField] || "";
                    normalized[cat.priceUnitField] = catData[cat.priceUnitField] || p[cat.priceUnitField] || "/ piece";
                  }

                  return normalized;
                });
                setEditedData(normalized);
              }

              setStep("select");
            }}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-500 transition"
          >
            <div className="font-medium text-gray-800">{cat.label}</div>
            <div className="text-xs text-gray-500 mt-1">{productsForCat.length} products</div>
          </button>
        );
      })}
    </div>
  </div>
</div>

    );
  }

  if (step === "select") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-lg px-4"
      onClick={onClose}
      >
  <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-md"
  onClick={(e) => e.stopPropagation()}
  >
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Select Fields to Edit</h2>
        {selectedCatalogueConfig && <p className="text-xs text-gray-500 mt-1">{selectedCatalogueConfig.label}</p>}
      </div>
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

    <div className="flex justify-between gap-3 mt-6">
      {!initialCatalogueId && (
        <button
          onClick={() => {
            setStep("catalogue");
            setSelectedFields([]);
          }}
          className="px-4 py-2 rounded-full text-sm font-medium bg-gray-300 text-gray-800 hover:bg-gray-400 transition shadow"
        >
          Back
        </button>
      )}
      <button
        onClick={() => setStep("edit")}
        className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition shadow ${
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
    <div className="sticky top-0 h-[40px] bg-black z-50"></div>
    <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center justify-between gap-3 px-4 relative">
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
        <div className="grid grid-cols-[32px_64px_repeat(auto-fill,minmax(190px,1fr))] gap-2 font-semibold text-xs py-2 border-b">
          <div>#</div>
          <div>Image</div>
          {selectedFields.map((field) => {
            const fieldLabel = FIELD_OPTIONS.find((f) => f.key === field)?.label;
            const isFilledFromMaster = filledFromMaster[field];
            return (
              <div key={field} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isFilledFromMaster}
                  onChange={() => toggleFillFromMaster(field)}
                  title={isFilledFromMaster ? "Uncheck to clear all values" : "Check to fill from Master catalogue"}
                  className="appearance-none w-4 h-4 border border-gray-400 rounded checked:bg-green-600 checked:border-green-600 cursor-pointer"
                />
                <span>{fieldLabel}</span>
              </div>
            );
          })}
        </div>

        {editedData.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[32px_64px_repeat(auto-fill,minmax(190px,1fr))] gap-2 items-center text-sm py-2 border-b"
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
                value={item.name}
                onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("subtitle") && (
              <input
                value={item.subtitle}
                onChange={(e) => handleFieldChange(item.id, "subtitle", e.target.value)}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("field1") && (
              <input
                value={item.field1}
                onChange={(e) => { handleFieldChange(item.id, "field1", e.target.value); handleFieldChange(item.id, "color", e.target.value); }}
                className="border rounded px-2 py-1"
              />
            )}

            {selectedFields.includes("field2") && (
  <div className="flex gap-2">
    <input
      value={item.field2}
      onChange={(e) => { handleFieldChange(item.id, "field2", e.target.value); handleFieldChange(item.id, "package", e.target.value); }}
      className="border rounded px-2 py-1 w-28"
    />
    <select
      value={item.field2Unit}
      onChange={(e) => { handleFieldChange(item.id, "field2Unit", e.target.value); handleFieldChange(item.id, "packageUnit", e.target.value); }}
      className="border rounded px-2 py-1 pr-8 w-16"
    >
      <option value="pcs / set">pcs / set</option>
      <option value="pcs / dozen">pcs / dozen</option>
      <option value="pcs / pack">pcs / pack</option>
    </select>
  </div>
)}


            {selectedFields.includes("field3") && (
              <div className="flex gap-2">
                <input
                  value={item.field3}
                  onChange={(e) => { handleFieldChange(item.id, "field3", e.target.value); handleFieldChange(item.id, "age", e.target.value); }}
                  className="border rounded px-2 py-1 w-28"
                />
                <select
                  value={item.field3Unit}
                  onChange={(e) => { handleFieldChange(item.id, "field3Unit", e.target.value); handleFieldChange(item.id, "ageUnit", e.target.value); }}
                  className="border rounded px-2 py-1 pr-8 w-16"
                >
                  <option value="months">months</option>
                  <option value="years">years</option>
                  <option value="Newborn">Newborn</option>
                </select>
              </div>
            )}

            {priceField && selectedFields.includes(priceField) && (
              <div className="flex gap-2">
                <input
                  value={item[priceField]}
                  onChange={(e) => handleFieldChange(item.id, priceField, e.target.value)}
                  className="border rounded px-2 py-1 w-28"
                  placeholder="Price"
                />
                <select
                  value={item[priceUnitField]}
                  onChange={(e) => handleFieldChange(item.id, priceUnitField, e.target.value)}
                  className="border rounded px-2 py-1 pr-8 w-16"
                >
                  <option value="/ piece">/ piece</option>
                  <option value="/ dozen">/ dozen</option>
                  <option value="/ set">/ set</option>
                </select>
              </div>
            )}

            {selectedFields.includes("wholesale") && (
              <div className="flex gap-2">
                <input
                  value={item.wholesale}
                  onChange={(e) => handleFieldChange(item.id, "wholesale", e.target.value)}
                  className="border rounded px-2 py-1 w-28"
                />
                <select
                  value={item.wholesaleUnit}
                  onChange={(e) => handleFieldChange(item.id, "wholesaleUnit", e.target.value)}
                  className="border rounded px-2 py-1 pr-8 w-16"
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
                  value={item.resell}
                  onChange={(e) => handleFieldChange(item.id, "resell", e.target.value)}
                  className="border rounded px-2 py-1 w-28"
                />
                <select
                  value={item.resellUnit}
                  onChange={(e) => handleFieldChange(item.id, "resellUnit", e.target.value)}
                  className="border rounded px-2 py-1 pr-8 w-16"
                >
                  <option value="/ piece">/ piece</option>
                  <option value="/ dozen">/ dozen</option>
                  <option value="/ set">/ set</option>
                </select>
              </div>
            )}

            {selectedFields.includes("badge") && (
              <input
                value={item.badge}
                onChange={(e) => handleFieldChange(item.id, "badge", e.target.value)}
                placeholder="Enter badge"
                className="border rounded px-2 py-1 w-full"
              />
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
        handleFieldChange(item.id, stockField, item[stockField] === "in" ? "out" : "in")
      }
      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
        item[stockField] === "in"
          ? "bg-green-600 text-white"
          : "bg-gray-300 text-gray-800"
      }`}
    >
      {stockField === 'wholesaleStock' ? 'WS' : stockField === 'resellStock' ? 'RS' : 'Stock'}: {item[stockField] === "in" ? "In" : "Out"}
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
      <h2 className="text-lg font-bold text-gray-800 mb-2">Render images?</h2>

      <p className="text-sm text-gray-600 mb-2">
        Your changes are saved. Would you like to render images now?
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
