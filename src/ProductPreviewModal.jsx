import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { FiX, FiShare2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useToast } from "./context/ToastContext";
import { getCatalogueData } from "./config/catalogueProductUtils";
import { getAllCatalogues } from "./config/catalogueConfig";

// Helper function to get CSS styles based on watermark position
const getWatermarkPositionStyles = (position) => {
  const baseStyles = {
    position: "absolute",
    fontFamily: "Arial, sans-serif",
    fontWeight: 500,
    pointerEvents: "none"
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

  return { ...baseStyles, ...positionMap[position] };
};

// Full Screen Image Viewer Component
const FullScreenImageViewer = ({ imageUrl, productName, isOpen, onClose, showWatermark, watermarkText, watermarkPosition }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Reset transform when image changes
  useEffect(() => {
    if (isOpen) {
      setTransform({ x: 0, y: 0, scale: 1 });
    }
  }, [isOpen, imageUrl]);

  // Get distance between two touch points
  const getDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y
      });
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      setIsDragging(false);
      const distance = getDistance(e.touches);
      setLastTouchDistance(distance);
    }
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && transform.scale > 1) {
      // Single touch drag (only when zoomed in)
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      setTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (e.touches.length === 2) {
      // Two touch pinch zoom
      const distance = getDistance(e.touches);
      
      if (lastTouchDistance > 0) {
        const scaleChange = distance / lastTouchDistance;
        const newScale = Math.min(Math.max(transform.scale * scaleChange, 1), 4);
        
        setTransform(prev => ({
          scale: newScale,
          x: prev.x,
          y: prev.y
        }));
      }
      
      setLastTouchDistance(distance);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setLastTouchDistance(0);
    
    // Reset position if zoomed out completely
    if (transform.scale <= 1) {
      setTransform({ x: 0, y: 0, scale: 1 });
    }
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e) => {
    if (transform.scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && transform.scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom for desktop
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(transform.scale + delta, 1), 4);
    
    if (newScale <= 1) {
      setTransform({ x: 0, y: 0, scale: 1 });
    } else {
      setTransform(prev => ({ ...prev, scale: newScale }));
    }
  };

  // Double tap to zoom
  const handleDoubleClick = (e) => {
    if (transform.scale > 1) {
      setTransform({ x: 0, y: 0, scale: 1 });
    } else {
      setTransform({ scale: 2, x: 0, y: 0 });
    }
  };

  // Share functionality
  const handleShare = async () => {
    const productName = product?.name || 'Product Image';

    const fetchBlob = async (url) => {
      const res = await fetch(url, { mode: 'cors' });
      return await res.blob();
    };

    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    try {
      // Prefer Web Share API when available
      if (navigator.share) {
        try {
          let blob;
          if (imageUrl.startsWith('data:')) {
            // data URLs can be fetched to get a blob
            const res = await fetch(imageUrl);
            blob = await res.blob();
          } else {
            blob = await fetchBlob(imageUrl);
          }

          const file = new File([blob], `${productName}.png`, { type: blob.type || 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: productName, text: productName });
            return;
          }

          // If file sharing is not supported, fallback to sharing the page URL (still user gesture)
          await navigator.share({ title: productName, text: productName, url: window.location.href });
          return;
        } catch (webShareErr) {
          console.warn('navigator.share failed or not supported for files:', webShareErr);
          // continue to native fallback
        }
      }

      // Capacitor native fallback (Android / iOS)
      try {
        let base64Data;
        if (imageUrl.startsWith('data:')) {
          base64Data = imageUrl.split(',')[1];
        } else {
          const blob = await fetchBlob(imageUrl);
          base64Data = await blobToBase64(blob);
        }

        const filename = `share_${Date.now()}.png`;
        // Use cache directory for temporary sharing files
        await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
        const fileUriResult = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
        const uri = fileUriResult.uri || fileUriResult.uri;

        await Share.share({ title: productName, text: productName, files: [uri] });
        return;
      } catch (nativeErr) {
        console.warn('Capacitor Share fallback failed:', nativeErr);
      }

      // Final fallback: force download
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `${productName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error sharing image:', error);
      setShareResult({
        status: "error",
        message: "Unable to share image. Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center cursor-pointer" data-fullscreen-image="true" onClick={onClose}>
      {/* Header with close and share buttons */}
      <div className="absolute left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent" style={{ top: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-full bg-black/30 backdrop-blur-sm"
        >
          <FiX size={24} />
        </button>
        
        <button
          onClick={handleShare}
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-full bg-black/30 backdrop-blur-sm"
        >
          <FiShare2 size={20} />
        </button>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden touch-none relative"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={productName}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          draggable={false}
        />

        {/* Watermark overlay - White/light for full-screen view against dark background */}
        {showWatermark && (
          <div
            style={{
              ...getWatermarkPositionStyles(watermarkPosition),
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.5px",
              zIndex: 5
            }}
          >
            {watermarkText}
          </div>
        )}
      </div>

    </div>
  );
};

// Main ProductPreviewModal Component
export default function ProductPreviewModal({
  product,
  tab,
  catalogueId: externalCatalogueId,
  onClose,
  onEdit,
  onToggleStock,
  onSwipeLeft,
  onSwipeRight,
  filteredProducts = [],
}) {
  const { showToast } = useToast();
  const [direction, setDirection] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [shareResult, setShareResult] = useState(null); // { status: 'success'|'error', message: string }
  const fullScreenImageRef = useRef(false);

  const handleDragEnd = (event, info) => {
    const offsetX = info.offset.x;
    const velocityY = info.velocity.y;

    if (offsetX < -40 && currentIndex < productList.length - 1) {
      setDirection(1);
      onSwipeLeft?.(productList[currentIndex + 1]);
    } else if (offsetX > 40 && currentIndex > 0) {
      setDirection(-1);
      onSwipeRight?.(productList[currentIndex - 1]);
    } else if (velocityY < -500) {
      // Fast upward flick
      onClose?.();
    }
  };

  // Update ref whenever showFullScreenImage changes
  useEffect(() => {
    fullScreenImageRef.current = showFullScreenImage;
  }, [showFullScreenImage]);

  useEffect(() => {
    const handler = () => {
      // If full screen image is open, close it instead of closing the preview
      if (fullScreenImageRef.current) {
        setShowFullScreenImage(false);
      } else {
        onClose();
      }
    };
    window.addEventListener("close-preview", handler);
    return () => window.removeEventListener("close-preview", handler);
  }, [onClose]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  // Check if watermark should be shown
  const [showWatermark, setShowWatermark] = useState(() => {
    const stored = localStorage.getItem("showWatermark");
    return stored !== null ? JSON.parse(stored) : false; // Default: false (hide watermark)
  });

  // Get custom watermark text
  const [watermarkText, setWatermarkText] = useState(() => {
    return localStorage.getItem("watermarkText") || "Created using CatShare";
  });

  // Get watermark position
  const [watermarkPosition, setWatermarkPosition] = useState(() => {
    return localStorage.getItem("watermarkPosition") || "bottom-center";
  });

  // Listen for watermark setting changes from Settings modal
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("showWatermark");
      setShowWatermark(stored !== null ? JSON.parse(stored) : false);

      const textStored = localStorage.getItem("watermarkText");
      setWatermarkText(textStored || "Created using CatShare");

      const positionStored = localStorage.getItem("watermarkPosition");
      setWatermarkPosition(positionStored || "bottom-center");
    };

    const handleWatermarkChange = () => {
      const stored = localStorage.getItem("showWatermark");
      setShowWatermark(stored !== null ? JSON.parse(stored) : false);

      const textStored = localStorage.getItem("watermarkText");
      setWatermarkText(textStored || "Created using CatShare");

      const positionStored = localStorage.getItem("watermarkPosition");
      setWatermarkPosition(positionStored || "bottom-center");
    };

    const handlePositionChange = (e) => {
      const positionStored = localStorage.getItem("watermarkPosition");
      setWatermarkPosition(positionStored || "bottom-center");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("watermarkTextChanged", handleWatermarkChange);
    window.addEventListener("watermarkPositionChanged", handlePositionChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("watermarkTextChanged", handleWatermarkChange);
      window.removeEventListener("watermarkPositionChanged", handlePositionChange);
    };
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      if (product?.imagePath) {
        try {
          const result = await Filesystem.readFile({
            path: product.imagePath,
            directory: Directory.Data,
          });
          setImageUrl(`data:image/png;base64,${result.data}`);
        } catch (err) {
          console.warn("Failed to load image from filesystem:", err);
          setImageUrl(product.image || "");
        }
      } else {
        setImageUrl(product.image || "");
      }
    };
    loadImage();
  }, [product]);

  // Handle image click to open full screen
  const handleImageClick = (e) => {
    e.stopPropagation();
    setShowFullScreenImage(true);
  };

  if (!product) return null;

  const getLighterColor = (color) => {
    if (!color || typeof color !== "string") return "#f0f0f0";
    if (color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      const [r, g, b] = rgbMatch.slice(1, 4).map(Number);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    return color;
  };

  const bothOut = !product.wholesaleStock && !product.resellStock;
  const productList = filteredProducts.length > 0 ? filteredProducts : [product];
  const currentIndex = productList.findIndex((p) => p.id === product.id);

  const isWhiteBg =
    product.imageBgColor?.toLowerCase() === "white" ||
    product.imageBgColor?.toLowerCase() === "#ffffff";

  const badgeBg = isWhiteBg ? "#fff" : "#000";
  const badgeText = isWhiteBg ? "#000" : "#fff";
  const badgeBorder = isWhiteBg ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)";

  // Helper function to check if ALL catalogues have product in stock
  const getAllStockStatus = () => {
    const allCatalogues = getAllCatalogues();
    return allCatalogues.every((cat) => product[cat.stockField]);
  };

  // Helper function to toggle stock for ALL catalogues
  const onToggleMasterStock = () => {
    const allCatalogues = getAllCatalogues();
    const allInStock = getAllStockStatus();
    const newStatus = !allInStock;

    // Create updated product with all catalogue stock fields toggled
    const updatedProduct = { ...product };
    allCatalogues.forEach((cat) => {
      updatedProduct[cat.stockField] = newStatus;
    });

    // Update product in parent component
    if (onToggleStock) {
      // Pass the updated product directly - we'll modify parent signature
      onToggleStock(updatedProduct, true); // true indicates master toggle
    }
  };

  // Get catalogue data based on which tab is being viewed
  const getCatalogueIdFromTab = () => {
    // If a catalogue ID was explicitly passed (from catalogue view), use that
    if (externalCatalogueId) return externalCatalogueId;
    // Handle legacy tab names
    if (tab === "catalogue1") return "cat1";
    if (tab === "catalogue2") return "cat2";
    // Handle direct catalogue IDs (cat1, cat2, cat3, etc.)
    if (tab && tab.startsWith("cat")) return tab;
    // For products tab, default to cat1
    return "cat1";
  };

  const catalogueId = getCatalogueIdFromTab();
  const catalogueData = getCatalogueData(product, catalogueId);

  // Get the catalogue configuration for price field info
  const catalogueConfig = getAllCatalogues().find(c => c.id === catalogueId);
  const priceField = catalogueConfig?.priceField || "price1";
  const priceUnitField = catalogueConfig?.priceUnitField || "price1Unit";

  // Check if product has a valid price for this catalogue
  const priceValue = catalogueData[priceField] || product[priceField];
  const hasPriceValue = priceValue !== undefined && priceValue !== null && priceValue !== "" && priceValue !== 0;

  // Helper function to check if a field has a valid value
  const hasFieldValue = (value) => value !== undefined && value !== null && value !== "";

  // Check each field - use only catalogue-specific data, not fallback to other catalogues
  // Only fall back to legacy field names if field is undefined/null (not if it's an empty string)
  const field1Value = catalogueData.field1 !== undefined && catalogueData.field1 !== null ? catalogueData.field1 : (product.color || "");
  const hasField1 = hasFieldValue(field1Value);

  const field2Value = catalogueData.field2 !== undefined && catalogueData.field2 !== null ? catalogueData.field2 : (product.package || "");
  const hasField2 = hasFieldValue(field2Value);

  const field3Value = catalogueData.field3 !== undefined && catalogueData.field3 !== null ? catalogueData.field3 : (product.age || "");
  const hasField3 = hasFieldValue(field3Value);

  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-xl bg-black/75 flex items-center justify-center z-50 pointer-events-auto"
        onClick={onClose}
        role="presentation"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={product.id}
            drag="x"
            dragElastic={0.2}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
            onDragEnd={handleDragEnd}
            custom={direction}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl overflow-hidden shadow-xl relative"
            style={{
              display: "flex",
              flexDirection: "column",
              width: "85vw",
              maxWidth: "400px",
            }}
            initial={(dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 })}
            animate={{
              x: 0,
              opacity: 1,
              transition: { type: "spring", damping: 30, stiffness: 600, mass: 0.01 }
            }}
            exit={(dir) => ({
              x: dir < 0 ? 300 : -300,
              opacity: 0,
              transition: { type: "spring", damping: 30, stiffness: 600, mass: 0.01 }
            })}
          >

            {/* Image Section - Click to open full screen */}
            <div
              style={{
                backgroundColor: product.imageBgColor || "white",
                textAlign: "center",
                padding: 0,
                position: "relative",
                boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: product.cropAspectRatio || 1,
                width: "100%",
              }}
              onClick={handleImageClick}
            >
              <img
                src={imageUrl}
                alt={product.name}
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
                    letterSpacing: "0.3px",
                    color: isWhiteBg ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.4)"
                  }}
                >
                  {watermarkText}
                </div>
              )}

              {bothOut && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(-30deg)",
                    width: "140%",
                    backgroundColor: "rgba(220, 38, 38, 0.6)",
                    color: "white",
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: "18px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    zIndex: 10,
                    pointerEvents: "none"
                  }}
                >
                  OUT OF STOCK
                </div>
              )}

              {product.badge && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    backgroundColor: badgeBg,
                    color: badgeText,
                    fontSize: 12,
                    fontWeight: 400,
                    padding: "5px 10px",
                    borderRadius: "999px",
                    opacity: 0.95,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    border: `1px solid ${badgeBorder}`,
                    letterSpacing: "0.4px",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.badge.toUpperCase()}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div
              style={{
                backgroundColor: getLighterColor(product.bgColor),
                color: product.fontColor || "white",
                padding: "12px 12px",
                fontSize: 15,
                overflow: "auto",
                flex: 1,
                minHeight: 0,
                touchAction: "pan-y",
              }}
              onTouchMove={(e) => {
                // Allow the touch event to propagate to parent for swipe detection
                // This ensures horizontal swipes work even in the scrollable area
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <p
                  style={{
                    fontWeight: "normal",
                    textShadow: "3px 3px 5px rgba(0,0,0,0.2)",
                    fontSize: 24,
                    margin: "0 0 3px 0",
                  }}
                >
                  {product.name}
                </p>
                {product.subtitle && (
                  <p style={{ fontStyle: "italic", fontSize: 16, margin: "0 0 0 0" }}>
                    ({product.subtitle})
                  </p>
                )}
              </div>
              <div style={{ textAlign: "left", lineHeight: 1.3, paddingLeft: 12, paddingRight: 8 }}>
                {hasField1 && (
                  <p style={{ margin: "2px 0", display: "flex" }}>
                    <span style={{ width: "90px" }}>Colour</span>
                    <span>:</span>
                    <span style={{ marginLeft: "8px" }}>{field1Value}</span>
                  </p>
                )}
                {hasField2 && (
                  <p style={{ margin: "2px 0", display: "flex" }}>
                    <span style={{ width: "90px" }}>Package</span>
                    <span>:</span>
                    <span style={{ marginLeft: "8px" }}>{field2Value} {catalogueData.field2Unit !== undefined && catalogueData.field2Unit !== null ? catalogueData.field2Unit : (product.packageUnit || "pcs / set")}</span>
                  </p>
                )}
                {hasField3 && (
                  <p style={{ margin: "2px 0", display: "flex" }}>
                    <span style={{ width: "90px" }}>Age Group</span>
                    <span>:</span>
                    <span style={{ marginLeft: "8px" }}>{field3Value} {catalogueData.field3Unit !== undefined && catalogueData.field3Unit !== null ? catalogueData.field3Unit : (product.ageUnit || "months")}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Bar - Show price based on catalogue-specific data (only if price exists) */}
            {hasPriceValue && (
              <div
                style={{
                  backgroundColor: product.bgColor || "#add8e6",
                  color: product.fontColor || "white",
                  padding: "6px 8px",
                  textAlign: "center",
                  fontWeight: "normal",
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{catalogueData[priceField] || product[priceField]} {catalogueData[priceUnitField] !== undefined && catalogueData[priceUnitField] !== null ? catalogueData[priceUnitField] : (product[priceUnitField] || "/ piece")}
              </div>
            )}

            {/* Action Buttons */}
            {tab === "products" && (
              <div className="px-3 py-2 bg-gray-100 border-t text-xs" style={{ flexShrink: 0 }}>
                {/* First row: Edit, All In/Out, Close */}
                <div className="flex justify-between gap-1">
                  <button onClick={onEdit} className="px-2 py-1 rounded bg-blue-500 text-white flex-1 text-xs">
                    Edit
                  </button>
                  <button
                    onClick={() => onToggleMasterStock()}
                    className={`px-2 py-1 rounded flex-1 text-xs ${
                      getAllStockStatus() ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"
                    }`}
                    title="Toggle all catalogues"
                  >
                    {getAllStockStatus() ? "In" : "Out"}
                  </button>
                  <button onClick={onClose} className="px-2 py-1 rounded bg-red-600 text-white flex-1 text-xs">
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Full Screen Image Viewer */}
      {showFullScreenImage && (
        <FullScreenImageViewer
          imageUrl={imageUrl}
          productName={product.name}
          isOpen={showFullScreenImage}
          onClose={() => setShowFullScreenImage(false)}
          showWatermark={showWatermark}
          watermarkText={watermarkText}
          watermarkPosition={watermarkPosition}
        />
      )}

      {/* Share Result Modal */}
      {shareResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              {shareResult.status === "success" ? (
                <FiCheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <FiAlertCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {shareResult.status === "success" ? "Success!" : "Failed"}
            </h2>

            <p className="text-sm text-gray-600 mb-5">
              {shareResult.message}
            </p>

            <button
              onClick={() => setShareResult(null)}
              className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
