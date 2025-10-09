// Final full CreateProduct.jsx with Save.jsx integration

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCroppedImg } from "./cropUtils";
import { getPalette } from "./colorUtils";
import { saveRenderedImage } from "./Save";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get("id");

  const categories = JSON.parse(localStorage.getItem("categories") || "[]");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    subtitle: "",
    color: "",
    package: "",
    age: "",
    wholesale: "",
    resell: "",
    stock: true,
    wholesaleStock: true,
    resellStock: true,
    category: [],
    badge: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFilePath, setImageFilePath] = useState(null);
  const [originalBase64, setOriginalBase64] = useState(null);
  const [overrideColor, setOverrideColor] = useState("#d1b3c4");
  const [fontColor, setFontColor] = useState("white");
  const [imageBgOverride, setImageBgOverride] = useState("white");
  const [suggestedColors, setSuggestedColors] = useState([]);

  const [wholesaleUnit, setWholesaleUnit] = useState("/ piece");
  const [resellUnit, setResellUnit] = useState("/ piece");
  const [packageUnit, setPackageUnit] = useState("pcs / set");
  const [ageGroupUnit, setAgeGroupUnit] = useState("months");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);
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
        setFormData({
          ...product,
          category: Array.isArray(product.category)
            ? product.category
            : product.category
            ? [product.category]
            : [],
        });
        setOverrideColor(product.bgColor || "#d1b3c4");
        setFontColor(product.fontColor || "white");
        setImageBgOverride(product.imageBgColor || "white");
        setWholesaleUnit(product.wholesaleUnit || "/ piece");
        setResellUnit(product.resellUnit || "/ piece");
        setPackageUnit(product.packageUnit || "pcs / set");
        setAgeGroupUnit(product.ageUnit || "months");

        if (product.image && product.image.startsWith("data:image")) {
          setImagePreview(product.image);
        } else if (product.imagePath) {
          setImageFilePath(product.imagePath);
          Filesystem.readFile({
            path: product.imagePath,
            directory: Directory.Data,
          }).then((res) => {
            setImagePreview(`data:image/png;base64,${res.data}`);
          });
        }
      }
    }
  }, [editingId]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveAndNavigate = async () => {
    if (!imagePreview) {
      alert("Please upload and crop an image before saving.");
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
      alert("❌ Image save failed:\n" + err.message);
      return;
    }

    const newItem = {
      ...formData,
      id,
      imagePath,
      fontColor: fontColor || "white",
      imageBgColor: imageBgOverride || "white",
      bgColor: overrideColor || "#add8e6",
      wholesaleUnit,
      resellUnit,
      packageUnit,
      ageUnit: ageGroupUnit,
      stock: formData.stock !== false,
      //image: imagePreview,
    };

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
    await saveRenderedImage(newItem, "resell", {
      resellUnit,
      wholesaleUnit,
      packageUnit,
      ageGroupUnit,
    });
    await saveRenderedImage(newItem, "wholesale", {
      resellUnit,
      wholesaleUnit,
      packageUnit,
      ageGroupUnit,
    });
  } catch (err) {
    console.warn("⏱️ PNG render failed:", err);
  }

  navigate("/");
}, 300);
    } catch (err) {
      alert("❌ Product save failed:\n" + err.message);
    }
  };

  const handleCancel = () => navigate("/");
  return (
    <div className="px-4 max-w-lg mx-auto text-sm" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5px)' }}>
      <div className="fixed top-0 left-0 right-0 h-[35px] bg-black z-50"></div>
      <div className="h-[35px]"></div>
      <header className="sticky top-[35px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center justify-center px-4 relative">
        <h1 className="text-xl font-bold leading-none">{editingId ? "Edit Product" : "Create Product"}</h1>
      </header>


      <div className="mb-3">
        <button
          onClick={handleSelectImage}
          className="relative bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg overflow-hidden group border-2 border-blue-600"
        >
          <span className="relative z-10">Choose Image</span>
          <span className="absolute inset-0 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Choose Image
          </span>
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
            <button
              onClick={applyCrop}
              className="bg-blue-500 text-white px-4 py-1 rounded"
            >
              Apply Crop
            </button>
            <button
              onClick={() => setCropping(false)}
              className="bg-gray-300 px-4 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!cropping && (
        <>
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
          <input
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Colour"
            className="border p-2 rounded w-full mb-2"
          />

          <div className="flex gap-2 mb-2">
            <input
              name="package"
              value={formData.package}
              onChange={handleChange}
              placeholder="Package"
              className="border p-2 w-full rounded"
            />
            <select
              value={packageUnit}
              onChange={(e) => setPackageUnit(e.target.value)}
              className="border p-2 rounded"
            >
              <option>pcs / set</option>
              <option>pcs / dozen</option>
              <option>pcs / pack</option>
            </select>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age Group"
              className="border p-2 w-full rounded"
            />
            <select
              value={ageGroupUnit}
              onChange={(e) => setAgeGroupUnit(e.target.value)}
              className="border p-2 rounded"
            >
              <option>months</option>
              <option>years</option>
              <option>Newborn</option>
            </select>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              name="wholesale"
              value={formData.wholesale}
              onChange={handleChange}
              placeholder="Wholesale Price"
              className="border p-2 w-full rounded"
            />
            <select
              value={wholesaleUnit}
              onChange={(e) => setWholesaleUnit(e.target.value)}
              className="border p-2 rounded"
            >
              <option>/ piece</option>
              <option>/ dozen</option>
            </select>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              name="resell"
              value={formData.resell}
              onChange={handleChange}
              placeholder="Resell Price"
              className="border p-2 w-full rounded"
            />
            <select
              value={resellUnit}
              onChange={(e) => setResellUnit(e.target.value)}
              className="border p-2 rounded"
            >
              <option>/ piece</option>
              <option>/ dozen</option>
            </select>
          </div>

          <label className="block text-sm font-medium mb-1">Product Badge</label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  badge: prev.badge === "Muslin" ? "" : "Muslin",
                }))
              }
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                formData.badge === "Muslin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Muslin
            </button>

            <input
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="or type new"
              className="border p-2 rounded text-sm"
            />
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

          <div className="my-3">
            <label className="block mb-1 font-semibold">Override BG:</label>
            <input
              type="color"
              value={overrideColor}
              onChange={(e) => setOverrideColor(e.target.value)}
            />
          </div>

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
  <div
    style={{
      backgroundColor: overrideColor,
      color: fontColor,
      padding: "8px",
      textAlign: "center",
      fontWeight: "normal",
      fontSize: 19,
    }}
  >
    Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{formData.wholesale}{" "}
    {wholesaleUnit}
  </div>

  {imagePreview && (
    <div
      style={{
        position: "relative",
        backgroundColor: imageBgOverride,
        textAlign: "center",
        padding: 10,
        boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
      }}
    >
      <img
        src={imagePreview}
        alt="Preview"
        style={{
          maxWidth: "100%",
          maxHeight: 300,
          objectFit: "contain",
          margin: "0 auto",
        }}
      />
      {formData.badge && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: badgeBg,
            color: badgeText,
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: "999px",
            opacity: 0.95,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            border: `1px solid ${badgeBorder}`,
            letterSpacing: "0.5px",
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
      <p>Colour&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {formData.color}</p>
      <p>Package&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {formData.package} {packageUnit}</p>
      <p>Age Group&nbsp;&nbsp;: {formData.age} {ageGroupUnit}</p>
    </div>
  </div>

  <div
    style={{
      backgroundColor: overrideColor,
      color: fontColor,
      padding: "8px",
      textAlign: "center",
      fontWeight: "normal",
      fontSize: 19,
    }}
  >
    Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{formData.resell} {resellUnit}
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
