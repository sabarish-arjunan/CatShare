// Final full CreateProduct.jsx with Save.jsx integration

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCroppedImg } from "./cropUtils";
import { getPalette } from "./colorUtils";
import { saveRenderedImage } from "./Save";
import { useToast } from "./context/ToastContext";
import { getAllCatalogues, type Catalogue } from "./config/catalogueConfig";
import { migrateProductToNewFormat } from "./config/fieldMigration";
import { getProductFieldValue, getProductUnitValue } from "./config/fieldMigration";
import { safeGetFromStorage } from "./utils/safeStorage";
import {
  initializeCatalogueData,
  getCatalogueData,
  setCatalogueData,
  isProductEnabledForCatalogue,
  setProductEnabledForCatalogue,
  type CatalogueData,
  type ProductWithCatalogueData
} from "./config/catalogueProductUtils";

// Helper function to get CSS styles based on watermark position
const getWatermarkPositionStyles = (position) => {
  const baseStyles = {
    position: "absolute",
    fontFamily: "Arial, sans-serif",
    fontWeight: 500,
    pointerEvents: "none",
    zIndex: 10
  };

  const positionMap = {
    "top-left": { top: 10, left: 10, transform: "none" },
    "top-center": { top: 10, left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: 10, right: 10, left: "auto", transform: "none" },
    "middle-left": { top: "50%", left: 10, transform: "translateY(-50%)" },
    "middle-center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "middle-right": { top: "50%", right: 10, left: "auto", transform: "translateY(-50%)" },
    "bottom-left": { bottom: 10, left: 10, transform: "none" },
    "bottom-center": { bottom: 10, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: 10, right: 10, left: "auto", transform: "none" }
  };

  const selectedPosition = positionMap[position] || positionMap["bottom-center"];
  return { ...baseStyles, ...selectedPosition };
};

function ColorPickerModal({ value, onChange, onClose }) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hexInput, setHexInput] = useState(value);

  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const rgbToHex = (rgb) => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return value;
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  };

  const currentColor = hslToRgb(hue, saturation, brightness);

  const handleHexChange = (hex) => {
    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHexInput(hex);
      onChange(hex);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-lg p-3 w-full" style={{ maxWidth: "320px" }}>
        <h2 className="font-bold text-lg mb-3">Choose Color</h2>

        {/* Hue Slider */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Hue</label>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                hsl(0, 100%, 50%), hsl(30, 100%, 50%), hsl(60, 100%, 50%),
                hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%),
                hsl(300, 100%, 50%), hsl(360, 100%, 50%))`
            }}
          />
        </div>

        {/* Saturation Slider */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Saturation</label>
          <input
            type="range"
            min="0"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                hsl(${hue}, 0%, ${brightness}%),
                hsl(${hue}, 100%, ${brightness}%))`
            }}
          />
        </div>

        {/* Brightness Slider */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Brightness</label>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation}%, 50%), #fff)`
            }}
          />
        </div>

        {/* Color Preview */}
        <div className="mb-3">
          <div
            style={{ backgroundColor: currentColor }}
            className="w-full h-16 rounded-lg border-2 border-gray-300"
          />
        </div>

        {/* Hex Input */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Hex Code</label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#ffffff"
            className="border rounded w-full p-2 text-sm font-mono"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onChange(currentColor)}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-medium"
          >
            Apply
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get("id");
  const catalogueParam = searchParams.get("catalogue");
  const fromParam = searchParams.get("from");
  const { showToast } = useToast();

  const categories = JSON.parse(localStorage.getItem("categories") || "[]");

  const [formData, setFormData] = useState<ProductWithCatalogueData>({
    id: "",
    name: "",
    subtitle: "",
    category: [],
    badge: "",
    catalogueData: {},
  });

  const [selectedCatalogue, setSelectedCatalogue] = useState<string>(catalogueParam || "cat1");
  const [fetchFieldsChecked, setFetchFieldsChecked] = useState(false);
  const [fetchPriceChecked, setFetchPriceChecked] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFilePath, setImageFilePath] = useState(null);
  const [showWatermark, setShowWatermarkLocal] = useState(() => {
    return safeGetFromStorage("showWatermark", false);
  });
  const [watermarkText, setWatermarkText] = useState(() => {
    return safeGetFromStorage("watermarkText", "Created using CatShare");
  });

  const [watermarkPosition, setWatermarkPosition] = useState(() => {
    return safeGetFromStorage("watermarkPosition", "bottom-center");
  });

  // Listen for watermark setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      setShowWatermarkLocal(safeGetFromStorage("showWatermark", false));
      setWatermarkText(safeGetFromStorage("watermarkText", "Created using CatShare"));
      setWatermarkPosition(safeGetFromStorage("watermarkPosition", "bottom-center"));
    };

    const handleWatermarkChange = () => {
      setShowWatermarkLocal(safeGetFromStorage("showWatermark", false));
      setWatermarkText(safeGetFromStorage("watermarkText", "Created using CatShare"));
      setWatermarkPosition(safeGetFromStorage("watermarkPosition", "bottom-center"));
    };

    const handlePositionChange = () => {
      setWatermarkPosition(safeGetFromStorage("watermarkPosition", "bottom-center"));
    };

    const handleWatermarkToggle = () => {
      setShowWatermarkLocal(safeGetFromStorage("showWatermark", false));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("watermarkTextChanged", handleWatermarkChange);
    window.addEventListener("watermarkPositionChanged", handlePositionChange);
    window.addEventListener("watermarkChanged", handleWatermarkToggle);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("watermarkTextChanged", handleWatermarkChange);
      window.removeEventListener("watermarkPositionChanged", handlePositionChange);
      window.removeEventListener("watermarkChanged", handleWatermarkToggle);
    };
  }, []);
  const [originalBase64, setOriginalBase64] = useState(null);
  const [overrideColor, setOverrideColor] = useState("#d1b3c4");
  const [fontColor, setFontColor] = useState("white");
  const [imageBgOverride, setImageBgOverride] = useState("white");
  const [suggestedColors, setSuggestedColors] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [price1Unit, setPrice1Unit] = useState("/ piece");
  const [price2Unit, setPrice2Unit] = useState("/ piece");
  const [packageUnit, setPackageUnit] = useState("pcs / set");
  const [ageGroupUnit, setAgeGroupUnit] = useState("months");
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);

  // Initialize catalogues on mount
  useEffect(() => {
    const cats = getAllCatalogues();
    setCatalogues(cats);
  }, []);

  // Reset checkboxes when catalogue changes
  useEffect(() => {
    setFetchFieldsChecked(false);
    setFetchPriceChecked(false);
  }, [selectedCatalogue]);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1); // 1 for 1:1, 1.333 for 3:4
  const [appliedAspectRatio, setAppliedAspectRatio] = useState(1); // Track which ratio was applied to current image
  const isWhiteBg =
    imageBgOverride?.toLowerCase() === "white" ||
    imageBgOverride?.toLowerCase() === "#ffffff";

  const badgeBg = isWhiteBg ? "#fff" : "#000";
  const badgeText = isWhiteBg ? "#000" : "#fff";
  const badgeBorder = isWhiteBg
    ? "rgba(0, 0, 0, 0.4)"
    : "rgba(255, 255, 255, 0.4)";

  const getLighterColor = (color) => {
    if (color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    return color;
  };

  useEffect(() => {
    if (editingId) {
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const product = products.find((p) => p.id === editingId);
      if (product) {
        // Migrate product in case it has old field names from backup
        const migratedProduct = migrateProductToNewFormat(product) as ProductWithCatalogueData;

        // Initialize catalogue data if not present
        if (!migratedProduct.catalogueData) {
          migratedProduct.catalogueData = initializeCatalogueData(migratedProduct);
        }

        setFormData({
          id: migratedProduct.id || "",
          name: migratedProduct.name || "",
          subtitle: migratedProduct.subtitle || "",
          category: Array.isArray(migratedProduct.category)
            ? migratedProduct.category
            : migratedProduct.category
            ? [migratedProduct.category]
            : [],
          badge: migratedProduct.badge || "",
          catalogueData: migratedProduct.catalogueData,
        });

        setOverrideColor(migratedProduct.bgColor || "#d1b3c4");
        setFontColor(migratedProduct.fontColor || "white");
        setImageBgOverride(migratedProduct.imageBgColor || "white");
        setAppliedAspectRatio(migratedProduct.cropAspectRatio || 1);

        if (migratedProduct.image && migratedProduct.image.startsWith("data:image")) {
          setImagePreview(migratedProduct.image);
        } else if (migratedProduct.imagePath) {
          setImageFilePath(migratedProduct.imagePath);
          Filesystem.readFile({
            path: migratedProduct.imagePath,
            directory: Directory.Data,
          }).then((res) => {
            setImagePreview(`data:image/png;base64,${res.data}`);
          });
        }
      }
    } else {
      // New product: initialize empty catalogue data
      setFormData((prev) => ({
        ...prev,
        catalogueData: initializeCatalogueData(),
      }));
    }
  }, [editingId]);

  // Get catalogue data for the selected catalogue
  const getCatalogueFormData = () => {
    return getCatalogueData(formData, selectedCatalogue);
  };

  // Update catalogue data for the selected catalogue
  const updateCatalogueData = (updates: Partial<CatalogueData>) => {
    setFormData((prev) => {
      const updated = { ...prev };
      setCatalogueData(updated, selectedCatalogue, updates);
      return updated;
    });
  };

  // Check if product is enabled for a catalogue
  const isCatalogueEnabled = (catalogueId: string) => {
    return isProductEnabledForCatalogue(formData, catalogueId);
  };

  // Toggle catalogue enabled state
  const toggleCatalogueEnabled = (catalogueId: string) => {
    setFormData((prev) => {
      const currentlyEnabled = isProductEnabledForCatalogue(prev, catalogueId);
      const newCatalogueData = { ...prev.catalogueData };

      // Create a new object for the catalogue entry
      newCatalogueData[catalogueId] = {
        ...(newCatalogueData[catalogueId] || {}),
        enabled: !currentlyEnabled
      };

      return {
        ...prev,
        catalogueData: newCatalogueData
      };
    });
  };

  // Fetch only fields from default catalogue (cat1)
  const handleFetchFieldsChange = (checked: boolean) => {
    setFetchFieldsChecked(checked);

    if (!checked) {
      // Clear fields when unchecked
      const updates: Partial<CatalogueData> = {
        field1: "",
        field2: "",
        field2Unit: "pcs / set",
        field3: "",
        field3Unit: "months",
      };
      updateCatalogueData(updates);
      return;
    }

    // Fetch from default catalogue when checked
    const defaultCatalogueData = getCatalogueData(formData, 'cat1');
    const selectedCat = catalogues.find((c) => c.id === selectedCatalogue);

    if (!selectedCat) return;

    const updates: Partial<CatalogueData> = {
      field1: defaultCatalogueData.field1 || "",
      field2: defaultCatalogueData.field2 || "",
      field2Unit: defaultCatalogueData.field2Unit || "pcs / set",
      field3: defaultCatalogueData.field3 || "",
      field3Unit: defaultCatalogueData.field3Unit || "months",
    };

    updateCatalogueData(updates);
    showToast(`Fields fetched from default catalogue to ${selectedCat.label}`, "success");
  };

  // Handle fetch price checkbox change
  const handleFetchPriceChange = (checked: boolean) => {
    setFetchPriceChecked(checked);

    const selectedCat = catalogues.find((c) => c.id === selectedCatalogue);
    if (!selectedCat) return;

    if (!checked) {
      // Clear price fields when unchecked
      const updates: Partial<CatalogueData> = {
        [selectedCat.priceField]: "",
        [selectedCat.priceUnitField]: "/ piece",
      };
      updateCatalogueData(updates);
      return;
    }

    // Fetch from default catalogue when checked
    const defaultCatalogueData = getCatalogueData(formData, 'cat1');

    // Prepare data to copy from default catalogue
    const defaultPriceField = catalogues.find((c) => c.id === 'cat1')?.priceField || 'price1';
    const defaultPriceUnitField = catalogues.find((c) => c.id === 'cat1')?.priceUnitField || 'price1Unit';

    const updates: Partial<CatalogueData> = {
      [selectedCat.priceField]: defaultCatalogueData[defaultPriceField] || "",
      [selectedCat.priceUnitField]: defaultCatalogueData[defaultPriceUnitField] || "/ piece",
    };

    updateCatalogueData(updates);
    showToast(`Price fetched from default catalogue to ${selectedCat.label}`, "success");
  };

  // Get the price field name for the selected catalogue
  const getSelectedCataloguePriceField = () => {
    const selectedCat = catalogues.find((c) => c.id === selectedCatalogue);
    return selectedCat?.priceField || "price1";
  };

  // Get the price unit field name for the selected catalogue
  const getSelectedCataloguePriceUnitField = () => {
    const selectedCat = catalogues.find((c) => c.id === selectedCatalogue);
    return selectedCat?.priceUnitField || "price1Unit";
  };

  // Get the price value for the selected catalogue
  const getSelectedCataloguePrice = () => {
    const priceField = getSelectedCataloguePriceField();
    return getCatalogueFormData()[priceField] || "";
  };

  // Get the price unit value for the selected catalogue
  const getSelectedCataloguePriceUnit = () => {
    const priceUnitField = getSelectedCataloguePriceUnitField();
    return getCatalogueFormData()[priceUnitField] || "/ piece";
  };

  const handleSelectImage = async () => {
    const defaultFolder = "Phone/Pictures/Photoroom";
    const folder = localStorage.getItem("lastUsedFolder") || defaultFolder;

    try {
      const res = await Filesystem.readdir({
        path: folder,
        directory: Directory.External,
      });

      const imageFile = res.files.find((f) =>
        f.name.match(/\.(jpg|jpeg|png|webp)$/i)
      );

      if (!imageFile) throw new Error("No image files found in folder");

      const fullPath = `${folder}/${imageFile.name}`;
      const fileData = await Filesystem.readFile({
        path: fullPath,
        directory: Directory.External,
      });

      const base64 = `data:image/png;base64,${fileData.data}`;
      setOriginalBase64(base64);
      setImagePreview(base64);
      setCropping(true);

      localStorage.setItem("lastUsedFolder", folder);
    } catch (err) {
      console.warn("Fallback to system file picker:", err.message);
      document.getElementById("fallback-file-input").click();
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

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const applyCrop = async () => {
    if (!imagePreview || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(
        imagePreview,
        croppedAreaPixels
      );
      setImagePreview(croppedBase64);
      setAppliedAspectRatio(aspectRatio); // Save the aspect ratio that was used
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    const commonFields = ['id', 'name', 'subtitle', 'category', 'badge'];

    if (commonFields.includes(name)) {
      // Common fields for all catalogues
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      // Catalogue-specific fields
      updateCatalogueData({ [name]: value });
    }
  };

  const saveAndNavigate = async () => {
    if (!imagePreview) {
      showToast("Please upload and crop an image before saving.", "warning");
      return;
    }

    const id = editingId || Date.now().toString();
    const imagePath = `catalogue/product-${id}.png`;

    try {
      if (imagePreview?.startsWith("data:image")) {
        const base64 = imagePreview.split(",")[1];
        await Filesystem.writeFile({
          path: imagePath,
          data: base64,
          directory: Directory.Data,
          recursive: true,
        });
      }
    } catch (err) {
      showToast("Image save failed: " + err.message, "error");
      return;
    }

    // Get data from the first enabled catalogue (usually cat1) for backward compatibility
    const defaultCatalogueData = getCatalogueData(formData, 'cat1');
    const allCatalogues = getAllCatalogues();

    // Build product with all catalogue price fields saved to root level
    const newItem: ProductWithCatalogueData = {
      ...formData,
      id,
      imagePath,
      fontColor: fontColor || "white",
      imageBgColor: imageBgOverride || "white",
      bgColor: overrideColor || "#add8e6",
      cropAspectRatio: appliedAspectRatio,
    };

    // 🧹 CRITICAL: Remove base64 image data from product object before saving to localStorage
    // This prevents QuotaExceededError as images are now stored in Filesystem
    if (newItem.image) {
      delete newItem.image;
    }

    // Save price and stock fields for ALL catalogues to the product root level
    for (const cat of allCatalogues) {
      const catData = getCatalogueData(formData, cat.id);
      newItem[cat.priceField] = catData[cat.priceField] || "";
      newItem[cat.priceUnitField] = catData[cat.priceUnitField] || "/ piece";
      newItem[cat.stockField] = catData[cat.stockField] !== false;
    }

    // Keep old names for backward compatibility at product level
    newItem.price1 = newItem.price1 || "";
    newItem.price2 = newItem.price2 || "";
    newItem.price1Unit = newItem.price1Unit || "/ piece";
    newItem.price2Unit = newItem.price2Unit || "/ piece";
    newItem.field1 = defaultCatalogueData.field1 || "";
    newItem.field2 = defaultCatalogueData.field2 || "";
    newItem.field3 = defaultCatalogueData.field3 || "";
    newItem.field2Unit = defaultCatalogueData.field2Unit || "pcs / set";
    newItem.field3Unit = defaultCatalogueData.field3Unit || "months";
    // Keep old names for backward compatibility
    newItem.wholesaleUnit = defaultCatalogueData.price1Unit || "/ piece";
    newItem.resellUnit = defaultCatalogueData.price2Unit || "/ piece";
    newItem.packageUnit = defaultCatalogueData.field2Unit || "pcs / set";
    newItem.ageUnit = defaultCatalogueData.field3Unit || "months";
    newItem.wholesale = newItem.price1 || "";
    newItem.resell = newItem.price2 || "";
    newItem.stock = newItem[allCatalogues[0]?.stockField || "wholesaleStock"] !== false;

    try {
      const all = JSON.parse(localStorage.getItem("products") || "[]");
      const updated = editingId
        ? all.map((p) => (p.id === editingId ? newItem : p))
        : [...all, newItem];

      localStorage.setItem("products", JSON.stringify(updated));

// 🔔 Emit event
window.dispatchEvent(new CustomEvent("product-added"));

setTimeout(async () => {
  try {
    // Render images for all enabled catalogues
    const enabledCats = catalogues.filter(cat => isCatalogueEnabled(cat.id));

    for (const cat of enabledCats) {
      const catData = getCatalogueData(newItem, cat.id);

      // Create render options for this catalogue
      const renderOptions = {
        catalogueId: cat.id,
        catalogueLabel: cat.label,
        folder: cat.folder || cat.label, // Use folder from catalogue config
        priceField: cat.priceField,
        priceUnitField: cat.priceUnitField,
        price1Unit: catData.price1Unit || "/ piece",
        price2Unit: catData.price2Unit || "/ piece",
        packageUnit: catData.field2Unit || "pcs / set",
        ageGroupUnit: catData.field3Unit || "months",
        // Legacy compat
        resellUnit: catData.price2Unit || "/ piece",
        wholesaleUnit: catData.price1Unit || "/ piece",
      };

      // Use legacy types for backward compat
      const legacyType = cat.id === "cat1" ? "wholesale" : cat.id === "cat2" ? "resell" : cat.id;

      await saveRenderedImage(newItem, legacyType, renderOptions);
    }
  } catch (err) {
    console.warn("⏱️ PNG render failed:", err);
  }

  // If fromParam is a catalogue ID (cat1, cat2, etc.), navigate to catalogues tab with that catalogue selected
  const isCatalogueId = fromParam && catalogues.some((c) => c.id === fromParam);
  const navigationPath = isCatalogueId ? `/?tab=catalogues&catalogue=${fromParam}` : "/";
  navigate(navigationPath);
}, 300);
    } catch (err) {
      showToast("Product save failed: " + err.message, "error");
    }
  };

  const handleCancel = () => {
    // If fromParam is a catalogue ID (cat1, cat2, etc.), navigate to catalogues tab with that catalogue selected
    const isCatalogueId = fromParam && catalogues.some((c) => c.id === fromParam);
    const navigationPath = isCatalogueId ? `/?tab=catalogues&catalogue=${fromParam}` : "/";
    navigate(navigationPath);
  };
  return (
    <div className="px-3 max-w-md mx-auto text-sm" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5px)' }}>
      <div className="fixed top-0 left-0 right-0 h-[40px] bg-black z-50"></div>
      <div className="h-[40px]"></div>
      <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center justify-center px-4 relative">
        <h1 className="text-xl font-bold leading-none">{editingId ? "Edit Product" : "Create Product"}</h1>
      </header>


      <div className="mb-2">
        <button
          onClick={handleSelectImage}
          className="group relative bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Choose Image
        </button>

        <input
          type="file"
          id="fallback-file-input"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </div>

      {cropping && imagePreview && (
        <div className="mb-4 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-4">
          {/* Header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Crop Image</h2>
            <p className="text-gray-500 text-xs">Adjust your product image to the perfect dimensions</p>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setAspectRatio(1)}
              className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 ${
                aspectRatio === 1
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v18H3z" />
              </svg>
              Square
            </button>
            <button
              onClick={() => setAspectRatio(3 / 4)}
              className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 ${
                aspectRatio === 3 / 4
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 3h16v18H4z" />
              </svg>
              Portrait
            </button>
          </div>

          {/* Info Tip */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">💡 Tip: Square format gives the best results</p>
              <p className="text-xs text-blue-700 mt-1">Square images render with optimal clarity and look great in catalogs</p>
            </div>
          </div>

          {/* Cropper Container */}
          <div className="mb-4 rounded-lg overflow-hidden shadow-md border-2 border-blue-200 bg-white">
            <div style={{ height: 300, position: "relative" }}>
              <Cropper
                image={imagePreview}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={applyCrop}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply
            </button>
            <button
              onClick={() => setCropping(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!cropping && (
        <>
          {/* COMMON FIELDS */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Product Details</h2>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Model Name"
              className="border p-2 rounded w-full mb-2"
            />
            <input
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Subtitle"
              className="border p-2 rounded w-full mb-2"
            />
            <label className="block text-sm font-medium mb-1">Product Badge</label>
            <input
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="Enter product badge"
              className="border p-2 rounded text-sm w-full"
            />
          </div>

          {/* CATALOGUE SELECTOR */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Select Catalogue to Edit:</label>
            <div className="flex gap-2 flex-wrap">
              {catalogues.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatalogue(cat.id)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    selectedCatalogue === cat.id
                      ? "bg-blue-600 text-white shadow"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* CATALOGUE-SPECIFIC FIELDS */}
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">
                {catalogues.find((c) => c.id === selectedCatalogue)?.label || "Catalogue"} Details
              </h3>
              <div className="flex gap-4 items-center">
                {selectedCatalogue !== 'cat1' && isCatalogueEnabled(selectedCatalogue) && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={fetchFieldsChecked}
                        onChange={(e) => handleFetchFieldsChange(e.target.checked)}
                        title="Fill fields (Colour, Package, Age Group) from default catalogue"
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-gray-700">Fill Fields</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={fetchPriceChecked}
                        onChange={(e) => handleFetchPriceChange(e.target.checked)}
                        title="Fill price from default catalogue"
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-gray-700">Fill Price</span>
                    </label>
                  </div>
                )}
                <button
                  onClick={() => toggleCatalogueEnabled(selectedCatalogue)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isCatalogueEnabled(selectedCatalogue)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                  }`}
                >
                  {isCatalogueEnabled(selectedCatalogue) ? "Show" : "Hide"}
                </button>
              </div>
            </div>

            {isCatalogueEnabled(selectedCatalogue) && (
              <>
                <input
                  name="field1"
                  value={getCatalogueFormData().field1 || ""}
                  onChange={handleChange}
                  placeholder="Colour"
                  className="border p-2 rounded w-full mb-2"
                />

                <div className="flex gap-2 mb-2">
                  <input
                    name="field2"
                    value={getCatalogueFormData().field2 || ""}
                    onChange={handleChange}
                    placeholder="Package"
                    className="border p-2 w-full rounded"
                  />
                  <select
                    name="field2Unit"
                    value={getCatalogueFormData().field2Unit || "pcs / set"}
                    onChange={handleChange}
                    className="border p-2 rounded min-w-[120px] appearance-none bg-white pr-8"
                  >
                    <option>pcs / set</option>
                    <option>pcs / dozen</option>
                    <option>pcs / pack</option>
                  </select>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    name="field3"
                    value={getCatalogueFormData().field3 || ""}
                    onChange={handleChange}
                    placeholder="Age Group"
                    className="border p-2 w-full rounded"
                  />
                  <select
                    name="field3Unit"
                    value={getCatalogueFormData().field3Unit || "months"}
                    onChange={handleChange}
                    className="border p-2 rounded min-w-[100px] appearance-none bg-white pr-8"
                  >
                    <option>months</option>
                    <option>years</option>
                    <option>Newborn</option>
                  </select>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    name={getSelectedCataloguePriceField()}
                    value={getSelectedCataloguePrice()}
                    onChange={handleChange}
                    placeholder="Price"
                    className="border p-2 w-full rounded"
                  />
                  <select
                    name={getSelectedCataloguePriceUnitField()}
                    value={getSelectedCataloguePriceUnit()}
                    onChange={handleChange}
                    className="border p-2 rounded min-w-[110px] appearance-none bg-white pr-8"
                  >
                    <option>/ piece</option>
                    <option>/ dozen</option>
                    <option>/ set</option>
                  </select>
                </div>
              </>
            )}

            {!isCatalogueEnabled(selectedCatalogue) && (
              <div className="text-center text-gray-500 py-4">
                Enable "{catalogues.find((c) => c.id === selectedCatalogue)?.label}" to add details
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = formData.category.includes(cat);
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        category: isSelected
                          ? prev.category.filter((c) => c !== cat)
                          : [...prev.category, cat],
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="my-2">
            <label className="block mb-1 font-semibold">Override BG:</label>
            <button
              onClick={() => setShowColorPicker(true)}
              className="flex items-center gap-2 w-full border rounded p-2 hover:bg-gray-50 transition-colors"
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: overrideColor,
                  border: "2px solid #ccc",
                  borderRadius: "6px",
                }}
              />
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-700">Choose color</div>
                <div className="text-sm text-gray-500 truncate">{overrideColor}</div>
              </div>
            </button>
          </div>

          {showColorPicker && (
            <ColorPickerModal
              value={overrideColor}
              onChange={(color) => {
                setOverrideColor(color);
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          )}

          {suggestedColors.length > 0 && (
            <div className="mb-3">
              <label className="block mb-1 font-semibold">Suggested Backgrounds:</label>
              <div className="flex gap-2 flex-wrap">
                {suggestedColors.map((color) => (
                  <div
                    key={color}
                    onClick={() => setOverrideColor(color)}
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: color,
                      border:
                        overrideColor === color
                          ? "3px solid black"
                          : "1px solid #ccc",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">Font Color</label>
              <div className="flex gap-2 mt-1">
                {["white", "black"].map((color) => (
                  <div
                    key={color}
                    onClick={() => setFontColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: color,
                      border:
                        fontColor === color
                          ? "3px solid black"
                          : "1px solid #ccc",
                      borderRadius: "100%",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Image BG</label>
              <div className="flex gap-2 mt-1">
                {["white", "black"].map((color) => (
                  <div
                    key={color}
                    onClick={() => setImageBgOverride(color)}
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: color,
                      border:
                        imageBgOverride === color
                          ? "3px solid black"
                          : "1px solid #ccc",
                      borderRadius: "100%",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
{/* Preview Section */}
<div
  id="catalogue-preview"
  className="mt-6 border rounded shadow overflow-hidden"
   style={{ maxWidth: 330, width: "100%" }}
>
  {imagePreview && (
    <div
      style={{
        position: "relative",
        backgroundColor: imageBgOverride,
        textAlign: "center",
        padding: 0,
        boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
        aspectRatio: appliedAspectRatio,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <img
        src={imagePreview}
        alt="Preview"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          margin: "0 auto",
        }}
      />

      {/* Watermark - Adaptive color based on background */}
      {showWatermark && (
        <div
          style={{
            ...getWatermarkPositionStyles(watermarkPosition),
            fontSize: "10px",
            color: imageBgOverride?.toLowerCase() === "white" || imageBgOverride?.toLowerCase() === "#ffffff"
              ? "rgba(0, 0, 0, 0.25)"
              : "rgba(255, 255, 255, 0.4)",
            letterSpacing: "0.3px"
          }}
        >
          {watermarkText}
        </div>
      )}

      {formData.badge && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: badgeBg,
            color: badgeText,
            fontSize: 13,
            fontWeight: 400,
            padding: "6px 10px",
            borderRadius: "999px",
            opacity: 0.95,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            border: `1px solid ${badgeBorder}`,
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {formData.badge.toUpperCase()}
        </div>
      )}
    </div>
  )}

  <div
    style={{
      backgroundColor: getLighterColor(overrideColor),
      color: fontColor,
      padding: 10,
    }}
  >
    <h2 className="text-lg font-semibold text-center">{formData.name}</h2>
    {formData.subtitle && (
      <p className="text-center italic text-sm">({formData.subtitle})</p>
    )}
    <div className="text-sm mt-2 space-y-1">
      <p>Colour&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {getCatalogueFormData().field1}</p>
      <p>Package&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {getCatalogueFormData().field2} {getCatalogueFormData().field2Unit}</p>
      <p>Age Group&nbsp;&nbsp;: {getCatalogueFormData().field3} {getCatalogueFormData().field3Unit}</p>
    </div>
  </div>

  <div
    style={{
      backgroundColor: overrideColor,
      color: fontColor,
      padding: "12px 8px",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 20,
    }}
  >
    Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{getSelectedCataloguePrice() || "0"} {getSelectedCataloguePriceUnit()}
  </div>
</div>

          <div className="flex gap-2 mt-4 mb-6">
            <button
              onClick={saveAndNavigate}
              className="bg-blue-600 text-white py-2 px-4 rounded w-full"
            >
              {editingId ? "Update Product" : "Save Product"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-300 py-2 px-4 rounded w-full"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
