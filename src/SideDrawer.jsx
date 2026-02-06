import React, { useState, useEffect, useRef } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MediaLibrary from "./MediaLibrary";
import BulkEdit from "./BulkEdit";
import { App } from "@capacitor/app";
import JSZip from "jszip";
import { saveRenderedImage } from "./Save";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { MdInventory2, MdBackup, MdCategory, MdBook, MdImage, MdSettings, MdPublic } from "react-icons/md";
import { RiEdit2Line } from "react-icons/ri";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { APP_VERSION } from "./config/version";
import { useToast } from "./context/ToastContext";
import { getCataloguesDefinition, setCataloguesDefinition, DEFAULT_CATALOGUES, getAllCatalogues, createLegacyResellCatalogueIfNeeded } from "./config/catalogueConfig";
import { ensureProductsHaveStockFields } from "./utils/dataMigration";
import { migrateProductToNewFormat } from "./config/fieldMigration";


export default function SideDrawer({
  open,
  onClose,
  products,
  imageMap,
  setProducts,
  setDeletedProducts,
  selected,
  onShowTutorial,
  darkMode,
  setDarkMode,
  isRendering,
  renderProgress,
  renderResult,
  setRenderResult,
  handleRenderAllPNGs,
}) {
  const [showCategories, setShowCategories] = useState(false);
   const [showMediaLibrary, setShowMediaLibrary] = useState(false);
   const [showBulkEdit, setShowBulkEdit] = useState(false);
const [showRenderConfirm, setShowRenderConfirm] = useState(false);
const [clickCountN, setClickCountN] = useState(0);
const [showHiddenFeatures, setShowHiddenFeatures] = useState(false);
const allproducts = JSON.parse(localStorage.getItem("products") || "[]");
const totalProducts = products.length;
const estimatedSeconds = Math.ceil(totalProducts * 2); // assuming ~1.5s per image
const [showBackupPopup, setShowBackupPopup] = useState(false);
const [showRenderAfterRestore, setShowRenderAfterRestore] = useState(false);
const [backupResult, setBackupResult] = useState(null); // { status: 'success'|'error', message: string }
const navigate = useNavigate();
const { showToast } = useToast();


  if (!open) return null;

  const handleNClick = () => {
    const newCount = clickCountN + 1;
    setClickCountN(newCount);
    if (newCount === 7) {
      setShowHiddenFeatures(true);
      setClickCountN(0); // Reset counter
    }
  };

  const handleDownloadRenderedImages = async () => {
  try {
    const zip = new JSZip();
    let hasImages = false;

    // Get all catalogues dynamically
    const catalogues = getAllCatalogues();

    // Also check for legacy folders for backward compatibility
    const foldersToCheck = [
      ...catalogues.map(cat => cat.folder || cat.label), // Use folder name (which is now set to catalogue name)
      "Wholesale", // Legacy support
      "Resell"     // Legacy support
    ];

    // Try to read each catalogue folder
    for (const folderName of foldersToCheck) {
      try {
        const files = await Filesystem.readdir({
          path: folderName,
          directory: Directory.External,
        });

        for (const file of files.files) {
          if (file.name.endsWith(".png")) {
            const fileData = await Filesystem.readFile({
              path: `${folderName}/${file.name}`,
              directory: Directory.External,
            });
            zip.file(`${folderName}/${file.name}`, fileData.data, { base64: true });
            hasImages = true;
          }
        }
      } catch (err) {
        console.warn(`Could not read ${folderName} folder:`, err.message);
        // Continue to next folder if this one doesn't exist
      }
    }

    if (!hasImages) {
      showToast("No rendered images found. Please render images first.", "info");
      return;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result.split(",")[1];

      const now = new Date();
      const timestamp = now.toISOString().replace(/[-T:.]/g, "").slice(0, 12);
      const filename = `catshare-rendered-images-${timestamp}.zip`;

      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.External,
        });

        await FileSharer.share({
          filename,
          base64Data,
          contentType: "application/zip",
        });

        showToast("Rendered images downloaded successfully!", "success");
      } catch (err) {
        showToast("Failed to download images: " + err.message, "error");
      }
    };

    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("Download rendered images failed:", err);
    showToast("Failed to download rendered images", "error");
  }
};

const handleBackup = async () => {
  const deleted = JSON.parse(localStorage.getItem("deletedProducts") || "[]");
  const cataloguesDefinition = getCataloguesDefinition();
  const categories = JSON.parse(localStorage.getItem("categories") || "[]");
  const zip = new JSZip();

  const dataForJson = [];
  const deletedForJson = [];

  for (const p of products) {
    const product = { ...p };
    delete product.imageBase64;

    if (p.imagePath) {
      try {
        const res = await Filesystem.readFile({
          path: p.imagePath,
          directory: Directory.Data,
        });

        const imageFilename = p.imagePath.split("/").pop();
        zip.file(`images/${imageFilename}`, res.data, { base64: true });

        product.imageFilename = imageFilename; // map in JSON
      } catch (err) {
        console.warn("Could not read image:", p.imagePath);
      }
    }

    dataForJson.push(product);
  }

  // Also process deleted products' images
  for (const p of deleted) {
    const product = { ...p };
    delete product.imageBase64;

    if (p.imagePath) {
      try {
        const res = await Filesystem.readFile({
          path: p.imagePath,
          directory: Directory.Data,
        });

        const imageFilename = p.imagePath.split("/").pop();
        zip.file(`images/${imageFilename}`, res.data, { base64: true });

        product.imageFilename = imageFilename; // map in JSON
      } catch (err) {
        console.warn("Could not read image:", p.imagePath);
      }
    }

    deletedForJson.push(product);
  }

  // Include catalogues definition and all settings in backup
  zip.file("catalogue-data.json", JSON.stringify({
    version: 2, // Increment version for future compatibility
    products: dataForJson,
    deleted: deletedForJson,
    cataloguesDefinition,
    categories,
    backupDate: new Date().toISOString(),
    appVersion: APP_VERSION
  }, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64Data = reader.result.split(",")[1];

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:.]/g, "").slice(0, 12);
    const filename = `catalogue-backup-${timestamp}.zip`;

    try {
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
      });

      await FileSharer.share({
        filename,
        base64Data,
        contentType: "application/zip",
      });

      setBackupResult({
        status: "success",
        message: "Backup ZIP created and shared",
      });
    } catch (err) {
      setBackupResult({
        status: "error",
        message: "Backup failed: " + err.message,
      });
    }
  };

  reader.readAsDataURL(blob);
};

 


const exportProductsToCSV = (products) => {
  if (!products || products.length === 0) {
    showToast("No products to export!", "warning");
    return;
  }

  // Convert objects to CSV format
  const headers = Object.keys(products[0]); // Use object keys as headers
  const csvRows = [
    headers.join(","), // header row
    ...products.map((product) =>
      headers
        .map((header) => {
          let val = product[header] ?? "";
          // Escape quotes and commas
          if (typeof val === "string") {
            val = val.replace(/"/g, '""');
            if (val.includes(",") || val.includes("\n")) {
              val = `"${val}"`;
            }
          }
          return val;
        })
        .join(",")
    ),
  ];

  const csvData = csvRows.join("\n");

  // Create a download link
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "products.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};




  const handleRestore = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const zip = await JSZip.loadAsync(event.target.result);
      const jsonFile = zip.file("catalogue-data.json");

      if (!jsonFile) throw new Error("Missing catalogue-data.json in backup");

      const jsonText = await jsonFile.async("text");
      const parsed = JSON.parse(jsonText);

      // Validate backup format
      if (!parsed.products || !Array.isArray(parsed.products)) {
        throw new Error("Invalid backup format: missing products array");
      }

      const rebuilt = await Promise.all(
        parsed.products.map(async (p) => {
          if (p.imageFilename && p.imagePath) {
            const imgFile = zip.file(`images/${p.imageFilename}`);
            if (imgFile) {
              const base64 = await imgFile.async("base64");

              try {
                await Filesystem.writeFile({
                  path: p.imagePath,
                  data: base64,
                  directory: Directory.Data,
                  recursive: true,
                });
              } catch (err) {
                console.warn("Image write failed:", p.imagePath);
              }
            }
          }

          const clean = { ...p };
          delete clean.imageBase64;
          delete clean.imageFilename;

          // Migrate old field names to new field names (Colour -> field1, Package -> field2, etc.)
          const migrated = migrateProductToNewFormat(clean);

          return migrated;
        })
      );

      setProducts(rebuilt);
      localStorage.setItem("products", JSON.stringify(rebuilt));

      // Restore categories from backup if available, otherwise extract from products
      if (parsed.categories && Array.isArray(parsed.categories)) {
        localStorage.setItem("categories", JSON.stringify(parsed.categories));
      } else {
        const categories = Array.from(
          new Set(
            rebuilt.flatMap((p) =>
              Array.isArray(p.category) ? p.category : [p.category]
            )
          )
        ).filter(Boolean);
        localStorage.setItem("categories", JSON.stringify(categories));
      }

      if (Array.isArray(parsed.deleted)) {
        // Also restore deleted products' images from the ZIP
        const rebuiltDeleted = await Promise.all(
          parsed.deleted.map(async (p) => {
            if (p.imageFilename && p.imagePath) {
              const imgFile = zip.file(`images/${p.imageFilename}`);
              if (imgFile) {
                const base64 = await imgFile.async("base64");

                try {
                  await Filesystem.writeFile({
                    path: p.imagePath,
                    data: base64,
                    directory: Directory.Data,
                    recursive: true,
                  });
                } catch (err) {
                  console.warn("Image write failed for deleted product:", p.imagePath);
                }
              }
            }

            const clean = { ...p };
            delete clean.imageBase64;
            delete clean.imageFilename;

            // Migrate old field names to new field names
            const migrated = migrateProductToNewFormat(clean);

            return migrated;
          })
        );

        setDeletedProducts(rebuiltDeleted);
        localStorage.setItem("deletedProducts", JSON.stringify(rebuiltDeleted));
      }

      // Restore catalogues definition from backup
      // If the backup doesn't have cataloguesDefinition (old backups v1), use defaults
      if (parsed.cataloguesDefinition) {
        setCataloguesDefinition(parsed.cataloguesDefinition);
        console.log("✅ Restored catalogues definition from backup");
      } else {
        // Backward compatibility: old backups don't have cataloguesDefinition
        // Use the current one if it exists, otherwise use defaults
        const currentCatalogues = getCataloguesDefinition();
        if (!currentCatalogues || currentCatalogues.catalogues.length === 0) {
          // If no catalogues exist, restore defaults
          setCataloguesDefinition({
            version: 1,
            catalogues: DEFAULT_CATALOGUES,
            lastUpdated: Date.now(),
          });
          console.log("⚠️ Old backup detected - using default catalogues");
        } else {
          console.log("ℹ️ Using existing catalogue configuration");
        }
      }

      // Auto-create legacy Resell catalogue if the backup has resell data (backward compatibility)
      // This ensures old data from the 2-catalogue system is accessible in the new single-catalogue system
      createLegacyResellCatalogueIfNeeded(rebuilt);

      // Re-run migrations after catalogues definition has been restored
      // This ensures all products have the proper field structure for the restored catalogues
      ensureProductsHaveStockFields();

      console.log(`✅ Backup restored successfully - ${rebuilt.length} products restored`);

      setShowRenderAfterRestore(true);
    } catch (err) {
      console.error("❌ Restore failed:", err);
      setBackupResult({
        status: "error",
        message: "Restore failed: " + err.message,
      });
    }
  };

  reader.readAsArrayBuffer(file);
};

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="absolute left-0 w-64 bg-white shadow-lg p-4 overflow-y-auto"
          style={{
            top: 0,
            height: "100%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="-mt-4 -mx-4 h-[40px] bg-black mb-4"></div>
          <h2 className="text-lg font-semibold mb-4">
            Me<span
              onClick={handleNClick}
              className="cursor-pointer"
              title={showHiddenFeatures ? "Features unlocked! 🎉" : ""}
            >n</span>u
          </h2>

          <button
  onClick={() => setShowBackupPopup(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <MdBackup className="text-gray-500 text-[18px]" />
  <span className="text-sm font-medium">Backup & Restore</span>
</button>



<button
  onClick={() => {
    navigate("/shelf");
    onClose();
  }}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <span className="text-gray-500 text-[18px]"><MdInventory2 /></span>
  <span className="text-sm font-medium">Shelf</span>
</button>

<button
  onClick={() => setShowCategories(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <MdCategory className="text-gray-500 text-[18px]" />
  <span className="text-sm font-medium">Manage Categories</span>
</button>

{showHiddenFeatures && (
  <>
    <button
      onClick={() => {
        navigate('/retail');
        onClose();
      }}
      className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
    >
      <span className="text-gray-500">🛍️</span>
      <span className="text-sm font-medium">Retail</span>
    </button>

    <button
      onClick={() => setShowMediaLibrary(true)}
      className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
    >
      <span className="text-gray-500">🖼️</span>
      <span className="text-sm font-medium">Media Library</span>
    </button>
  </>
)}

<button
  onClick={() => setShowBulkEdit(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <RiEdit2Line className="text-gray-500 text-[18px]" />
  <span className="text-sm font-medium">Bulk Editor</span>
</button>

<button
  onClick={() => {
    navigate("/settings");
    onClose();
  }}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <MdSettings className="text-gray-500 text-[18px]" />
  <span className="text-sm font-medium">Settings</span>
</button>

<button
  onClick={() => {
    navigate("/website");
    onClose();
  }}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition shadow-md"
>
  <MdPublic className="text-white text-[18px]" />
  <span className="text-sm font-medium">Website</span>
</button>

<button
  onClick={() => {
    onShowTutorial();
  }}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <MdBook className="text-gray-500 text-[18px]" />
  <span className="text-sm font-medium">Tutorial</span>
</button>

<div>
<button
  onClick={() => setShowRenderConfirm(true)}
  disabled={isRendering}
  className={`w-full flex items-center gap-3 px-5 py-3 mb-1 rounded-lg text-sm font-medium transition shadow-sm ${
    isRendering
      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
      : "bg-gray-800 text-white hover:bg-gray-700"
  }`}
>
  <MdImage className={`text-[18px] ${isRendering ? "text-gray-400" : "text-white"}`} />
  <span>{isRendering ? "Rendering images..." : "Render images"}</span>
</button>

{showHiddenFeatures && (
  <button
    onClick={() => handleDownloadRenderedImages()}
    className="w-full flex items-center gap-3 px-5 py-3 rounded-lg text-sm font-medium transition shadow-sm bg-blue-600 text-white hover:bg-blue-700 mb-2"
    title="Download all rendered product images"
  >
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <span>Download PNGs</span>
  </button>
)}

{showBackupPopup && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
  onClick={() => setShowBackupPopup(false)}
  >
    <div className="bg-white/80 border border-white/50 backdrop-blur-xl shadow-2xl rounded-2xl p-6 w-full max-w-xs text-center"
    onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Backup & Restore</h2>

      <div className="flex justify-center items-center gap-8 mb-4">
        {/* Backup */}
        <button
          onClick={() => {
            setShowBackupPopup(false);
            handleBackup();
          }}
          className="flex flex-col items-center justify-center hover:text-gray-700 transition"
        >
          <div className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center text-2xl shadow-md">
            📦
          </div>
          <span className="text-xs font-medium text-gray-700 mt-2">Backup & Share</span>
        </button>

        {/* Restore */}
        <label className="flex flex-col items-center justify-center cursor-pointer hover:text-gray-700 transition">
          <div className="w-12 h-12 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-2xl shadow-md">
            📂
          </div>
          <span className="text-xs font-medium text-gray-700 mt-2">Restore</span>
          <input
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              setShowBackupPopup(false);
              handleRestore(e);
            }}
          />
        </label>
      </div>

      <button
        onClick={() => setShowBackupPopup(false)}
        className="mt-1 text-sm text-gray-500 hover:text-red-500 transition"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{showRenderAfterRestore && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50 flex items-center justify-center px-4">
    <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-xs">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">Render images?</h2>

      <div className="space-y-3 mb-4">
        <p className="text-sm text-gray-600">
          Your catalogue has been restored. Would you like to render images now?
        </p>

        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <p className="text-xs text-red-800">
            <span className="font-semibold">⚠️ Important:</span> Rendering images is <span className="font-semibold">must to share</span> the images. Without rendering, you cannot share product images with customers.
          </p>
        </div>

        <p className="text-sm text-gray-600">
          Estimated time: <span className="font-semibold">{estimatedSeconds}</span> sec for {totalProducts} products
        </p>
      </div>

      <div className="flex justify-center gap-4 pb-[env(safe-area-inset-bottom)]">
        <button
          className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-sm"
          onClick={() => {
            setShowRenderAfterRestore(false);
            handleRenderAllPNGs();
          }}
        >
          Continue
        </button>

        <button
          className="px-5 py-2 rounded-full bg-gray-300 text-gray-800 font-medium shadow hover:bg-gray-400 transition text-sm"
          onClick={() => {
            setShowRenderAfterRestore(false);
            onClose();
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  </div>
)}

{showRenderConfirm && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-lg px-4">
    <div className="backdrop-blur-xl bg-white/70 border border-white/40 p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center">
      <p className="text-lg font-medium text-gray-800 mb-2">Render all product PNGs?</p>
<p className="text-sm text-gray-600 mb-4">
  Estimated time: <span className="font-semibold">{estimatedSeconds}</span> sec for {totalProducts} products
</p>

      <div className="flex justify-center gap-4">
        <button
          className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-900 transition"
          onClick={() => {
            setShowRenderConfirm(false);
            onClose();
            setTimeout(() => handleRenderAllPNGs(), 50);
          }}
        >
          Yes
        </button>
        <button
          className="px-5 py-2 rounded-full bg-gray-300 text-gray-800 font-medium shadow hover:bg-gray-400 transition"
          onClick={() => setShowRenderConfirm(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{backupResult && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center">
      <div className="flex justify-center mb-4">
        {backupResult.status === "success" ? (
          <FiCheckCircle className="w-12 h-12 text-green-500" />
        ) : (
          <FiAlertCircle className="w-12 h-12 text-red-500" />
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        {backupResult.status === "success" ? "Success!" : "Failed"}
      </h2>

      <p className="text-sm text-gray-600 mb-5">
        {backupResult.message}
      </p>

      <button
        onClick={() => {
          setBackupResult(null);
          onClose();
        }}
        className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
      >
        OK
      </button>
    </div>
  </div>
)}


  {isRendering && (
    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${renderProgress}%` }}
      />
    </div>
  )}

<div className="pt-4 mt-5 border-t">
    <div className="text-center text-xs text-gray-400 mb-3">
      Created by <span className="font-semibold text-gray-600">BazelWings</span>
    </div>
  </div>
</div>
        </div>

        {/* Legal Links - Fixed at Bottom */}
        <div className="absolute left-0 w-64 bottom-0 bg-white pt-3 pb-4">
          <div className="flex flex-col items-center gap-2 mb-3 px-4">
            <span className="text-xs text-gray-500">CatShare v{APP_VERSION}</span>
          </div>
          <div className="flex justify-center items-center gap-3 text-xs px-4">
            <button
              onClick={() => {
                navigate("/privacy");
                onClose();
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Privacy Policy
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => {
                navigate("/terms");
                onClose();
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {showMediaLibrary && (
        <MediaLibrary
          onClose={() => setShowMediaLibrary(false)}
          onSelect={() => setShowMediaLibrary(false)}
        />
      )}

      {showBulkEdit && (() => {
        try {
          const allProds = JSON.parse(localStorage.getItem("products") || "[]");
          return (
            <BulkEdit
              products={products}
              allProducts={allProds}
              imageMap={imageMap}
              setProducts={setProducts}
              onClose={() => setShowBulkEdit(false)}
              triggerRender={handleRenderAllPNGs}
            />
          );
        } catch (err) {
          console.error("💥 Error in BulkEdit:", err);
          return <div className='text-red-600'>BulkEdit crashed.</div>;
        }
      })()}

      {showCategories && (
        <CategoryModal onClose={() => setShowCategories(false)} />
      )}

    </>
  );
}

function DragWrapper({ children, provided }) {
  const style = {
    ...provided.draggableProps.style,
    zIndex: 9999,
    position: "fixed",
    pointerEvents: "none",
    width: provided.draggableProps.style?.width || "300px", // lock width
    left: provided.draggableProps.style?.left,
    top: provided.draggableProps.style?.top,
  };

  return ReactDOM.createPortal(
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={style}
    >
      {children}
    </div>,
    document.body
  );
}


// 🔁 Updated Category Modal with drag & drop
function CategoryModal({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");


  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("categories") || "[]");
    setCategories(stored);
  }, []);

  useEffect(() => {
  let backHandler;

  const setup = async () => {
    backHandler = await App.addListener("backButton", () => {
      onClose();
    });
  };

  setup();

  return () => {
    if (backHandler) backHandler.remove();
  };
}, [onClose]);


  const save = (list) => {
    setCategories(list);
    localStorage.setItem("categories", JSON.stringify(list));
  };

  const add = () => {
    const c = newCat.trim();
    if (c && !categories.includes(c)) {
      save([...categories, c]);
      setNewCat("");
    }
  };

  const update = () => {
    const list = [...categories];
    list[editIndex] = editText.trim();
    save(list);
    setEditIndex(null);
    setEditText("");
  };

  const remove = (i) => {
    const list = categories.filter((_, idx) => idx !== i);
    save(list);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    save(reordered);
  };

  return (
    <div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
  onClick={onClose} // close when clicking outside
>
  <div
    className="bg-white w-full max-w-md p-5 rounded-xl shadow-lg relative animate-fadeIn"
    onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
  >

        <h3 className="text-xl font-bold mb-4 text-center">Manage Categories</h3>

        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-2xl text-gray-500 hover:text-red-500"
        >
          &times;
        </button>

        {/* Add new category */}
        <div className="flex gap-2 mb-4">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category"
            className="flex-1 border px-3 py-2 rounded text-sm"
          />
          <button
            onClick={add}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
          >
            Add
          </button>
        </div>

        {/* Category list with drag-and-drop */}
        {categories.length === 0 ? (
          <p className="text-center text-gray-400 italic">No categories yet</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="category-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 max-h-[420px] overflow-y-auto pr-1"
                >
                  {categories.map((cat, i) => (
                    <Draggable key={cat} draggableId={cat} index={i}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm shadow"
                        >
                          <div className="flex items-center gap-2 flex-grow">
                            <span
                              {...provided.dragHandleProps}
                              className="cursor-move text-gray-500"
                              title="Drag"
                            >
                              ☰
                            </span>
                            {editIndex === i ? (
                              <input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 border px-2 py-1 rounded"
                              />
                            ) : (
                              <span className="flex-1">{cat}</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {editIndex === i ? (
                              <>
                                <button
                                  onClick={update}
                                  className="text-blue-600 hover:underline"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditIndex(null)}
                                  className="text-gray-500 hover:underline"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditIndex(i);
                                    setEditText(cat);
                                  }}
                                  className="text-blue-600 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => remove(i)}
                                  className="text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
