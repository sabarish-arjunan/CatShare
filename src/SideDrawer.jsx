import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MediaLibrary from "./MediaLibrary";
import BulkEdit from "./BulkEdit";
import { App } from "@capacitor/app";
import JSZip from "jszip";
import { saveRenderedImage } from "./Save";
import RenderingOverlay from "./RenderingOverlay"; // path to the Lottie animation overlay
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { MdInventory2 } from "react-icons/md";


export default function SideDrawer({
  open,
  onClose,
  products,
  imageMap,
  setProducts,
  setDeletedProducts,
  selected,
}) {
  const [showCategories, setShowCategories] = useState(false);
   const [showMediaLibrary, setShowMediaLibrary] = useState(false);
   const [showBulkEdit, setShowBulkEdit] = useState(false);
   const [renderProgress, setRenderProgress] = useState(0);
const [isRendering, setIsRendering] = useState(false);
const shouldRender = useRef(false);
const [showRenderConfirm, setShowRenderConfirm] = useState(false);
const allproducts = JSON.parse(localStorage.getItem("products") || "[]");
const totalProducts = products.length;
const estimatedSeconds = Math.ceil(totalProducts * 2); // assuming ~1.5s per image
const [showBackupPopup, setShowBackupPopup] = useState(false);
const navigate = useNavigate();


  if (!open) return null;

  const handleBackup = async () => {
  const deleted = JSON.parse(localStorage.getItem("deletedProducts") || "[]");
  const zip = new JSZip();

  const dataForJson = [];

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

  zip.file("catalogue-data.json", JSON.stringify({ products: dataForJson, deleted }, null, 2));

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
        directory: Directory.External,
      });

      await FileSharer.share({
        filename,
        base64Data,
        contentType: "application/zip",
      });

      alert("✅ Backup ZIP created and shared.");
    } catch (err) {
      alert("❌ Backup failed: " + err.message);
    }

    onClose();
  };

  reader.readAsDataURL(blob);
};

 
const handleRenderAllPNGs = async () => {
  const all = JSON.parse(localStorage.getItem("products") || "[]");
  if (all.length === 0) return;

  setIsRendering(true);
  setRenderProgress(0);

  for (let i = 0; i < all.length; i++) {
    const product = all[i];

    // 🧠 Inject base64 from imageMap (used in CatalogueApp)
    if (!product.image && imageMap[product.id]) {
      product.image = imageMap[product.id];
    }

    try {
      await saveRenderedImage(product, "resell", {
        resellUnit: product.resellUnit || "/ piece",
        wholesaleUnit: product.wholesaleUnit || "/ piece",
        packageUnit: product.packageUnit || "pcs / set",
        ageGroupUnit: product.ageUnit || "months",
      });

      await saveRenderedImage(product, "wholesale", {
        resellUnit: product.resellUnit || "/ piece",
        wholesaleUnit: product.wholesaleUnit || "/ piece",
        packageUnit: product.packageUnit || "pcs / set",
        ageGroupUnit: product.ageUnit || "months",
      });

      console.log(`✅ Rendered PNGs for ${product.name}`);
    } catch (err) {
      console.warn(`❌ Failed to render PNGs for ${product.name}`, err);
    }

    setRenderProgress(Math.round(((i + 1) / all.length) * 100));
  }

  alert("✅ PNG rendering completed for all products.");
  setIsRendering(false);
};


const exportProductsToCSV = (products) => {
  if (!products || products.length === 0) {
    alert("No products to export!");
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

      if (!jsonFile) throw new Error("Missing JSON");

      const jsonText = await jsonFile.async("text");
      const parsed = JSON.parse(jsonText);

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
          return clean;
        })
      );

      setProducts(rebuilt);

      const categories = Array.from(
        new Set(
          rebuilt.flatMap((p) =>
            Array.isArray(p.category) ? p.category : [p.category]
          )
        )
      ).filter(Boolean);

      localStorage.setItem("categories", JSON.stringify(categories));

      if (Array.isArray(parsed.deleted)) {
        setDeletedProducts(parsed.deleted);
        localStorage.setItem("deletedProducts", JSON.stringify(parsed.deleted));
      }

      alert("✅ Restore complete");
    } catch (err) {
      alert("❌ Restore failed: " + err.message);
    }

    onClose();
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
          <h2 className="text-lg font-semibold mb-4">Menu</h2>

          <button
  onClick={() => setShowBackupPopup(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <span className="w-5 text-gray-500">🛠️</span>
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
  <span className="text-gray-500">🗂️</span>
  <span className="text-sm font-medium">Manage Categories</span>
</button>

<button
  onClick={() => setShowMediaLibrary(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <span className="text-gray-500">🖼️</span>
  <span className="text-sm font-medium">Media Library</span>
</button>

<button
  onClick={() => setShowBulkEdit(true)}
  className="w-full flex items-center gap-3 px-5 py-3 mb-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition shadow-sm"
>
  <span className="text-gray-500">✏️</span>
  <span className="text-sm font-medium">Bulk Editor</span>
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
  <span>🔁</span>
  <span>{isRendering ? "Rendering PNGs..." : "Render PNGs"}</span>
</button>

<div className="pt-4 mt-5 border-t text-center text-xs text-gray-400">
    Created by <span className="font-semibold text-gray-600">Sabarish Arjunan</span>
  </div>

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
            handleRenderAllPNGs();
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



  {isRendering && (
    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${renderProgress}%` }}
      />
    </div>
  )}
</div>



        </div>
      </div>

{showMediaLibrary && (
  <MediaLibrary
    onClose={() => setShowMediaLibrary(false)}
    onSelect={() => setShowMediaLibrary(false)} // ← temp, will connect to product later
  />
)}  

{showBulkEdit && (() => {
  try {
    return (
      <BulkEdit
  products={products}
  imageMap={imageMap}   // ✅ this is the missing prop
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
      
      <RenderingOverlay
  visible={isRendering}
  current={Math.round((renderProgress / 100) * products.length)}
  total={products.length}
/>

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
