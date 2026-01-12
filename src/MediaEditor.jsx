// MediaEditor.jsx - Final Version with Crop Fix, Swipe-to-Close, Icons, and Improved Layout

import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import { Filesystem } from "@capacitor/filesystem";
import { MEDIA_DIR } from "./MediaLibraryUtils";
import { getCroppedImg, applyAdjustments } from "./editUtils";
import { useToast } from "./context/ToastContext";
import { usePopup } from "./context/PopupContext";
import {
  FiSun,
  FiSliders,
  FiRotateCcw,
  FiRefreshCw,
  FiRepeat,
  FiArrowUp,
  FiChevronDown,
  FiZap,
  FiEyeOff,
} from "react-icons/fi";

export default function MediaEditor({ image, onClose, onSave }) {
  const { showToast } = useToast();
  const { showPopup } = usePopup();
  const [tab, setTab] = useState("adjust");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [editingSrc, setEditingSrc] = useState(image.src); // Live working copy


  const [rotateDeg, setRotateDeg] = useState(0);
  const [flip, setFlip] = useState(false);
  const [rotateAdjust, setRotateAdjust] = useState(0);
  const [verticalSkew, setVerticalSkew] = useState(0);
  const [horizontalSkew, setHorizontalSkew] = useState(0);

  const applyCropNow = async () => {
  if (croppedAreaPixels) {
    const cropped = await getCroppedImg(editingSrc, croppedAreaPixels);
    setEditingSrc(cropped);
    setTab("adjust"); // Or exit crop mode
  }
};

  const [original, setOriginal] = useState(image.src);

  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    shadows: 0,
    highlights: 0,
    vibrance: 0,
    exposure: 0,
    blackpoint: 0,
  });

  const [activeAdjustment, setActiveAdjustment] = useState("brightness");
  const containerRef = useRef(null);
  const startY = useRef(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleRevert = async () => {
    try {
      const backupPath = image.path.replace(".png", "_original.bak");
      const res = await Filesystem.readFile({
        path: backupPath,
        directory: MEDIA_DIR,
      });
      await Filesystem.writeFile({
        path: image.path,
        data: res.data,
        directory: MEDIA_DIR,
      });
      setOriginal(`data:image/png;base64,${res.data}`);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        shadows: 0,
        highlights: 0,
        vibrance: 0,
        exposure: 0,
        blackpoint: 0,
      });
    } catch {
      showToast("Original backup not found", "error");
    }
  };

  const handleRemoveBg = async () => {
  const blob = await fetch(image.src).then((r) => r.blob());

  const formData = new FormData();
  formData.append("image_file", blob);

  try {
    const res = await fetch("http://localhost:5000/remove-bg", {
      method: "POST",
      body: formData,
    });

    const blobResult = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      editorRef.current.loadImage(reader.result); // Load result into Pixie
    };
    reader.readAsDataURL(blobResult);
  } catch (err) {
    showToast("Background removal failed", "error");
  }
};

  const handleAutoEnhance = () => {
    setFilters({
      brightness: 115,
      contrast: 115,
      saturation: 120,
      shadows: 15,
      highlights: -10,
      vibrance: 10,
      exposure: 5,
      blackpoint: 5,
    });
    setTab("adjust");
  };

  const handleSave = async () => {
    let base = original;
    if (croppedAreaPixels) {
      base = await getCroppedImg(original, croppedAreaPixels, rotateDeg + rotateAdjust, flip);
    }
    const filtered = await applyAdjustments(base, filters);
    const base64 = filtered.split(",")[1];

    await Filesystem.writeFile({
      path: image.path,
      data: base64,
      directory: MEDIA_DIR,
    });

    onSave(filtered);
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - startY.current;
    if (dy < -80) onClose();
  };

  const ADJUSTMENTS = [
    { key: "brightness", icon: <FiSun /> },
    { key: "contrast", icon: <FiZap /> },
    { key: "saturation", icon: <FiSliders /> },
    { key: "shadows", icon: <FiChevronDown /> },
    { key: "highlights", icon: <FiChevronDown /> },
    { key: "vibrance", icon: <FiArrowUp /> },
    { key: "exposure", icon: <FiEyeOff /> },
    { key: "blackpoint", icon: <FiRotateCcw /> },
  ];

  const CROP_CONTROLS = [
    { label: "Crop", action: null, icon: <FiCropIcon /> },
    { label: "Rotate", action: () => setRotateDeg((v) => (v + 90) % 360), icon: <FiRefreshCw /> },
    { label: "Mirror", action: () => setFlip((v) => !v), icon: <FiRepeat /> },
    { label: "Adjust", action: () => setRotateAdjust((v) => v + 5), icon: <FiRotateCcw /> },
    { label: "Vertical", action: () => setVerticalSkew((v) => v + 5), icon: <FiChevronDown /> },
    { label: "Horizontal", action: () => setHorizontalSkew((v) => v + 5), icon: <FiChevronDown /> },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-black text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 bg-black">
        <button onClick={onClose} className="text-blue-400">Cancel</button>
        <div className="text-xs uppercase text-gray-400">{tab}</div>
        <button onClick={handleSave} className="text-blue-400">Done</button>
      </div>

      {/* 75% Image Preview Area */}
<div className="flex-1 max-h-[75vh] flex items-center justify-center bg-black">
  {tab === "crop" ? (
    <div className="relative w-full h-full max-h-[75vh] z-10">
      <Cropper
        image={editingSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
        cropShape="rect"
        showGrid={false}
        style={{
          containerStyle: {
            width: "100%",
            height: "100%",
          },
          mediaStyle: {
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
          },
          cropAreaStyle: {
            borderRadius: 0,
          },
        }}
      />
    </div>
  ) : (
    <img
      src={editingSrc}
      alt="preview"
      className="max-h-full max-w-full object-contain"
      style={{
        filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`,
        transform: `rotate(${rotateDeg + rotateAdjust}deg) scaleX(${flip ? -1 : 1}) skewX(${horizontalSkew}deg) skewY(${verticalSkew}deg)`
      }}
    />
  )}
</div>

      {/* 25% Editing Controls */}
      <div className="min-h-[25vh] bg-black border-t border-gray-800 px-4 py-2 overflow-y-auto">
        <div className="flex justify-around mb-3 text-xs">
          <button onClick={() => setTab("crop")} className={tab === "crop" ? "text-green-400" : ""}>Crop</button>
          <button onClick={() => setTab("adjust")} className={tab === "adjust" ? "text-green-400" : ""}>Adjust</button>
          <button onClick={handleAutoEnhance}>AI Enhance</button>
          <button onClick={handleRevert}>Revert</button>
          <button onClick={handleRemoveBg}>Remove BG</button>

        </div>

        {tab === "crop" && (
          <div className="flex justify-between overflow-x-auto gap-4 text-center">
            {CROP_CONTROLS.map(({ label, action, icon }) => (
              <button key={label} onClick={action} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                  {icon || label[0]}
                </div>
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "adjust" && (
  <>
    {/* Adjustment option buttons */}
    <div className="flex gap-4 overflow-x-auto mb-3 px-4">
      {ADJUSTMENTS.map(({ key, icon }) => (
        <button
          key={key}
          onClick={() => setActiveAdjustment(key)}
          className={`flex flex-col items-center text-xs ${
            activeAdjustment === key ? "text-green-400" : "text-white"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-xs mt-1">{key}</span>
        </button>
      ))}
    </div>

    {/* Slider */}
    {activeAdjustment && (
      <div className="fixed bottom-0 left-0 right-0 z-20 px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] bg-black">
        <input
          type="range"
          min={["brightness", "contrast", "saturation"].includes(activeAdjustment) ? 0 : -100}
          max={["brightness", "contrast", "saturation"].includes(activeAdjustment) ? 200 : 100}
          value={filters[activeAdjustment]}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              [activeAdjustment]: Number(e.target.value),
            }))
          }
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider-thumb-white accent-green-400"
        />
      </div>
    )}
  </>
)}

      </div>
    </div>
  );
}

function FiCropIcon() {
  return <div className="w-3 h-3 border border-white rotate-45"></div>;
}
