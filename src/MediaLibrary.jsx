import React, { useEffect, useState, useRef } from "react";
import { Filesystem, Directory as FilesystemDirectory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import {
  addImageToLibrary,
  loadMediaIndex as loadMediaFiles
} from "./MediaLibraryUtils";
import {
  FiEdit2,
  FiTrash2,
  FiShare2,
  FiX,
  FiPlus,
  FiCheckSquare,
  FiSquare,
  FiChevronLeft,
  FiRotateCcw,
} from "react-icons/fi";
import MediaEditor from "./MediaEditor";
import { useToast } from "./context/ToastContext";
import { usePopup } from "./context/PopupContext";

export default function MediaLibrary({ onSelect, onClose }) {
  const { showToast } = useToast();
  const { showPopup } = usePopup();
  const [media, setMedia] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showEditor, setShowEditor] = useState(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const list = await loadMediaFiles();
    setMedia(list);
  };

  const handleAdd = async () => {
    const items = await addImageToLibrary("photos", true);
    setMedia((prev) => [...items.reverse(), ...prev]);
  };

  const handleDelete = async (ids) => {
    if (!window.confirm("Delete selected images?")) return;
    const updated = media.filter((m) => !ids.includes(m.id));
    for (let id of ids) {
      const m = media.find((i) => i.id === id);
      if (m) {
        try {
          await Filesystem.deleteFile({ path: m.path, directory: FilesystemDirectory.Documents });
        } catch {}
      }
    }
    setMedia(updated);
    setSelected([]);
    setSelectMode(false);
  };

  const handleShare = async () => {
    for (const id of selected) {
      const item = media.find((m) => m.id === id);
      if (item) {
        const res = await Filesystem.readFile({
          path: item.path,
          directory: FilesystemDirectory.Documents,
        });
        await Share.share({
          title: item.name,
          text: "Check this image",
          url: `data:image/png;base64,${res.data}`,
        });
      }
    }
    setSelectMode(false);
    setSelected([]);
  };

  const toggleSelect = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : [...selected, id];
    setSelected(updated);
    if (updated.length === 0) setSelectMode(false);
  };

  const startSelect = (id) => {
    setSelectMode(true);
    setSelected([id]);
  };

  const restoreOriginalBackup = async (mediaItem) => {
    const backupPath = mediaItem.path.replace(".png", "_original.bak");
    try {
      const res = await Filesystem.readFile({
        path: backupPath,
        directory: FilesystemDirectory.Documents,
      });
      await Filesystem.writeFile({
        path: mediaItem.path,
        data: res.data,
        directory: FilesystemDirectory.Documents,
      });
      await loadMedia();
      showToast("Image reverted to original", "success");
    } catch {
      showToast("No original backup found", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>
      <div className="sticky top-[40px] bg-white p-4 border-b z-10 flex items-center justify-between shadow">
        <h2 className="text-xl font-semibold">Media Library</h2>
        <div className="flex gap-4 items-center text-xl">
          {selectMode ? (
            <>
              <button onClick={handleShare}><FiShare2 /></button>
              <button onClick={() => handleDelete(selected)}><FiTrash2 /></button>
              <button onClick={() => { setSelectMode(false); setSelected([]); }}><FiX /></button>
            </>
          ) : (
            <button onClick={() => setSelectMode(true)}><FiCheckSquare /></button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><FiX /></button>
        </div>
      </div>

      <div className="p-2 sm:p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {media.length === 0 ? (
          <p className="col-span-full text-center text-gray-400 italic mt-8">No media yet</p>
        ) : (
          media.map((m) => (
            <MediaItem
              key={m.id}
              item={m}
              selected={selected.includes(m.id)}
              selectMode={selectMode}
              onSelect={() => toggleSelect(m.id)}
              onClick={() => {
                if (selectMode) toggleSelect(m.id);
                else setPreview(m);
              }}
              onLongPress={() => startSelect(m.id)}
            />
          ))
        )}
      </div>

      <button
        onClick={handleAdd}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl z-50"
      >
        <FiPlus size={24} />
      </button>

      {preview && (
        <FullScreenPreview
          item={preview}
          onClose={() => setPreview(null)}
          setShowEditor={setShowEditor}
          onRevert={restoreOriginalBackup}
        />
      )}

      {showEditor && (
        <MediaEditor
          image={{ src: showEditor.base64, path: showEditor.path }}
          onClose={() => setShowEditor(null)}
          onSave={async () => {
            await loadMedia();
            setShowEditor(null);
          }}
        />
      )}
    </div>
  );
}

function MediaItem({ item, onClick, onLongPress, selected, selectMode, onSelect }) {
  const [src, setSrc] = useState("");
  const touchTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const dataUrl = await Filesystem.readFile({
          path: item.path,
          directory: FilesystemDirectory.Documents,
        });
        setSrc(`data:image/png;base64,${dataUrl.data}`);
      } catch (err) {
        console.error("Image load failed", err);
      }
    })();
  }, [item.path]);

  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(touchTimer.current);
  };

  return (
    <div
      className="relative w-full h-full"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={src}
        alt="media"
        className={`w-full h-full object-cover rounded shadow cursor-pointer ${selected ? "ring-4 ring-blue-500" : ""}`}
      />
      {selectMode && (
        <div className="absolute top-1 left-1 bg-white bg-opacity-80 rounded-full p-1 text-xs">
          {selected ? <FiCheckSquare /> : <FiSquare />}
        </div>
      )}
    </div>
  );
}

function FullScreenPreview({ item, onClose, setShowEditor, onRevert }) {
  const [src, setSrc] = useState("");
  const [index, setIndex] = useState(0);
  const [allMedia, setAllMedia] = useState([]);
  const startX = useRef(null);
  const startY = useRef(null);

  useEffect(() => {
    (async () => {
      const list = await loadMediaFiles();
      setAllMedia(list);
      const initialIndex = list.findIndex((i) => i.id === item.id);
      setIndex(initialIndex);
      loadImage(list[initialIndex]);
    })();
  }, [item]);

  const loadImage = async (mediaItem) => {
    try {
      const dataUrl = await Filesystem.readFile({
        path: mediaItem.path,
        directory: FilesystemDirectory.Documents,
      });
      const base64 = `data:image/png;base64,${dataUrl.data}`;
      setSrc(base64);
      mediaItem.base64 = base64;
    } catch (err) {
      console.error("Image load failed", err);
    }
  };

  const openInSystemEditor = async (fileName) => {
  const fullPath = `/storage/emulated/0/CatShare/Library/${fileName}`;
  console.log("Launching system editor for:", fullPath);

  try {
    await Capacitor.Plugins.GalleryEditor.openEditor({ path: fullPath });
  } catch (err) {
    showToast("Failed to open system editor", "error");
    console.error("System editor error:", err);
  }
};


  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      const newIndex = index + (dx < 0 ? 1 : -1);
      if (newIndex >= 0 && newIndex < allMedia.length) {
        setIndex(newIndex);
        loadImage(allMedia[newIndex]);
      }
    }

    if (dy < -80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const currentItem = allMedia[index] || item;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 flex justify-between items-center bg-black border-b border-gray-700">
        <button onClick={onClose} className="text-xl"><FiChevronLeft /></button>
        <div className="flex gap-4 text-xl">
          <button onClick={() => setShowEditor(currentItem)} title="Edit in App"><FiEdit2 /></button>
          <button onClick={() => openInSystemEditor(currentItem.name)} title="Edit in Gallery"><FiEdit2 className="text-green-400" /></button>
          <button onClick={() => onRevert(currentItem)} title="Revert"><FiRotateCcw /></button>
          <button onClick={onClose}><FiX /></button>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center bg-black overflow-hidden">
        <div className="w-full h-full flex justify-center items-center">
          <img
            src={src}
            alt="preview"
            className="object-contain max-h-[80vh] max-w-full"
          />
        </div>
        <div className="absolute bottom-4 text-sm text-gray-300 text-center w-full px-2 truncate">
          {currentItem.name}
        </div>
      </div>
    </div>
  );
}
