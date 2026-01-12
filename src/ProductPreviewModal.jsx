import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { FiX, FiShare2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useToast } from "./context/ToastContext";

// Full Screen Image Viewer Component
const FullScreenImageViewer = ({ imageUrl, productName, isOpen, onClose }) => {
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
      showToast('Unable to share image. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Header with close and share buttons */}
      <div className="absolute left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent" style={{ top: 0 }}>
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
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
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
      </div>

    </div>
  );
};

// Main ProductPreviewModal Component
export default function ProductPreviewModal({
  product,
  tab,
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

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-preview", handler);
    return () => window.removeEventListener("close-preview", handler);
  }, [onClose]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

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

  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-xl bg-black/75 flex items-center justify-center z-50"
        onClick={onClose}
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
            className="bg-white max-w-[350px] w-[90%] rounded-xl overflow-hidden shadow-xl relative"
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
            {/* Top Bar */}
            {tab !== "resell" && (
              <div
                style={{
                  backgroundColor: product.bgColor || "#add8e6",
                  color: product.fontColor || "white",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "normal",
                  fontSize: 19,
                }}
              >
                Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{product.wholesale} {product.wholesaleUnit}
              </div>
            )}

            {/* Image Section - Click to open full screen */}
            <div
              style={{
                backgroundColor: product.imageBgColor || "white",
                textAlign: "center",
                padding: 16,
                position: "relative",
                boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
                cursor: "pointer"
              }}
              onClick={handleImageClick}
            >
              <img
                src={imageUrl}
                alt={product.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
              />

            
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
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: "999px",
                    opacity: 0.95,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    border: `1px solid ${badgeBorder}`,
                    letterSpacing: "0.4px",
                    pointerEvents: "none"
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
                padding: 10,
                fontSize: 17,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <p
                  style={{
                    fontWeight: "normal",
                    textShadow: "3px 3px 5px rgba(0,0,0,0.2)",
                    fontSize: 28,
                    margin: 3,
                  }}
                >
                  {product.name}
                </p>
                {product.subtitle && (
                  <p style={{ fontStyle: "italic", fontSize: 18, margin: 5 }}>
                    ({product.subtitle})
                  </p>
                )}
              </div>
              <div style={{ textAlign: "left", lineHeight: 1.5 }}>
                <p style={{ margin: "3px 0" }}>
                  &nbsp; Colour &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;{product.color}
                </p>
                <p style={{ margin: "3px 0" }}>
                  &nbsp; Package &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;{product.package} {product.packageUnit}
                </p>
                <p style={{ margin: "3px 0" }}>
                  &nbsp; Age Group &nbsp;&nbsp;: &nbsp;&nbsp;{product.age} {product.ageUnit}
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            {tab !== "wholesale" && (
              <div
                style={{
                  backgroundColor: product.bgColor || "#add8e6",
                  color: product.fontColor || "white",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "normal",
                  fontSize: 19,
                }}
              >
                Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{product.resell} {product.resellUnit}
              </div>
            )}

            {/* Action Buttons */}
            {tab === "products" && (
              <div className="flex justify-between px-4 py-3 bg-gray-100 border-t text-sm">
                <button onClick={onEdit} className="px-3 py-1 rounded bg-blue-500 text-white">
                  Edit
                </button>
                <button
                  onClick={() => onToggleStock("wholesaleStock")}
                  className={`px-3 py-1 rounded ${
                    product.wholesaleStock ? "bg-green-700 text-white" : "bg-gray-300 text-gray-800"
                  }`}
                >
                  WS {product.wholesaleStock ? "In" : "Out"}
                </button>
                <button
                  onClick={() => onToggleStock("resellStock")}
                  className={`px-3 py-1 rounded ${
                    product.resellStock ? "bg-amber-500 text-white" : "bg-gray-300 text-gray-800"
                  }`}
                >
                  RS {product.resellStock ? "In" : "Out"}
                </button>
                <button onClick={onClose} className="px-3 py-1 rounded bg-red-600 text-white">
                  Close
                </button>
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
        />
      )}
    </>
  );
}
