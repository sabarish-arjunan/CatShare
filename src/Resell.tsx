// updated with raw SVG icons for proper innerHTML rendering
import React, { useState, useMemo, useEffect, useRef } from "react";
import { handleShare } from "./Share";
import { HiCheck } from "react-icons/hi";
import { Filesystem, Directory } from "@capacitor/filesystem";
import html2canvas from "html2canvas-pro";
import { AnimatePresence, motion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { App } from "@capacitor/app";
import { usePopup } from "./context/PopupContext";


export default function ResellTab({
  filtered,
  selected,
  setSelected,
  getLighterColor,
  imageMap,
}) {
  const [stockFilter, setStockFilter] = useState(["in", "out"]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);
  const { showPopup } = usePopup();


useEffect(() => {
  if (showSearch && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [showSearch]);


  const openPreviewHtml = (id, tab = null, filteredList = []) => {
    const evt = new CustomEvent("open-preview", {
      detail: { id, tab, filtered: filteredList },
    });
    window.dispatchEvent(evt);
  };

  useEffect(() => {
  const toggleSearch = () => setShowSearch((prev) => !prev);
  window.addEventListener("toggle-search", toggleSearch);
  return () => window.removeEventListener("toggle-search", toggleSearch);
}, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("categories") || "[]");
    setAllCategories(stored);
  }, []);

  useEffect(() => {
    if (selected.length === 0) setSelectMode(false);
  }, [selected]);

  useEffect(() => {
  const handlePopState = async () => {
    if (selectMode) {
      setSelectMode(false);
      setSelected([]);
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        console.warn("Haptics not supported:", err);
      }

      // Re-push fake screen again so future back gestures work
      window.history.pushState({ select: true }, "");
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, [selectMode]);

useEffect(() => {
  // Push a fake entry to trap back
  window.history.pushState({ tab: "resell" }, "");
}, []);




  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const visibleProducts = useMemo(() => {
  return filtered
    .filter((p) => {
      const matchesStock =
        (stockFilter.includes("in") && p.resellStock) ||
        (stockFilter.includes("out") && !p.resellStock);
      const matchesCategory =
        categoryFilter === "" ||
        (Array.isArray(p.category)
          ? p.category.includes(categoryFilter)
          : p.category === categoryFilter);
      const matchesSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.subtitle?.toLowerCase().includes(search.toLowerCase());
      return matchesStock && matchesCategory && matchesSearch;
    });
}, [filtered, stockFilter, categoryFilter, search]);


  let touchTimer = null;
  let startX = 0;
  let startY = 0;
  let moved = false;

  const handleTouchStart = (e, id) => {
    moved = false;
    const touch = e.touches?.[0] || e;
    startX = touch.clientX;
    startY = touch.clientY;

    touchTimer = setTimeout(() => {
      if (!moved) {
        if (!selectMode) {
  window.history.pushState({ select: true }, ""); // Push fake screen only once
}
setSelectMode(true);
setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));

        }
    }, 300);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches?.[0] || e;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > 10 || dy > 10) {
      moved = true;
      clearTimeout(touchTimer);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(touchTimer);
  };

  const handleCardClick = (id) => {
    if (selectMode) {
      toggleSelection(id);
    } else {
      openPreviewHtml(id, "resell", visibleProducts);
    }
  };

  useEffect(() => {
    const toggleFilterHandler = () => setShowFilters((prev) => !prev);
    window.addEventListener("toggle-resell-filter", toggleFilterHandler);
    return () => window.removeEventListener("toggle-resell-filter", toggleFilterHandler);
  }, []);

  useEffect(() => {
    const container = document.getElementById("resell-header-icons");
    if (!container) return;
    container.innerHTML = "";

    const filterBtn = document.createElement("button");
    filterBtn.className = "text-gray-600 hover:text-black";
    filterBtn.innerHTML = `<svg class='w-5 h-5' fill='none' stroke='currentColor' stroke-width='1.5' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M3 4h18M3 10h18M6 16h12' /></svg>`;
    filterBtn.onclick = () => setShowFilters(true);
    container.appendChild(filterBtn);

    if (selectMode) {
      const count = document.createElement("span");
      count.className = "text-xs bg-red-500 text-white rounded-full px-1";
      count.innerText = selected.length;
      container.appendChild(count);

      const shareBtn = document.createElement("button");
      shareBtn.className = "text-green-600 hover:text-green-800 ml-2";
      shareBtn.innerHTML = `<svg class='w-5 h-5' fill='none' stroke='currentColor' stroke-width='1.5' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M16.5 12a4.5 4.5 0 01-9 0m9 0A4.5 4.5 0 007.5 12m9 0V5.25M7.5 12V5.25m0 0h9' /></svg>`;
      shareBtn.onclick = async () => {
        await handleShare({
          selected,
          setProcessing,
          setProcessingIndex,
          setProcessingTotal,
          mode: "resell",
        });
      };
      container.appendChild(shareBtn);

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "ml-2 text-sm text-gray-600 hover:text-black";
      toggleBtn.innerHTML =
        selected.length === visibleProducts.length
          ? `<svg class='w-5 h-5' fill='none' stroke='currentColor' stroke-width='1.5' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M4 6h16M4 12h16M4 18h16' /></svg>`
          : `<svg class='w-5 h-5' fill='none' stroke='currentColor' stroke-width='1.5' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7' /></svg>`;
      toggleBtn.title = selected.length === visibleProducts.length ? "Deselect All" : "Select All";
      toggleBtn.onclick = () =>
        setSelected(
          selected.length === visibleProducts.length
            ? []
            : visibleProducts.map((p) => p.id)
        );
      container.appendChild(toggleBtn);
    }
  }, [selectMode, selected, visibleProducts]);

  return (
    <>
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-screen h-[40px] bg-black z-50" />
    <header className="fixed left-1/2 -translate-x-1/2 w-screen z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
  {/* Menu Button */}
  <AnimatePresence mode="wait" initial={false}>
  {!showSearch && (
    <motion.button
      key="menu-x-toggle"
      onClick={() => {
        if (selectMode) {
          setSelectMode(false);
          setSelected([]);
        } else {
          window.dispatchEvent(new Event("toggle-menu"));
        }
      }}
      className="relative w-8 h-8 shrink-0 flex items-center justify-center"
      title={selectMode ? "Exit Selection" : "Menu"}
    >
      {/* Top Line */}
      <motion.span
        className="absolute w-6 h-0.5 bg-gray-700"
        initial={false}
        animate={{
          rotate: selectMode ? 45 : 0,
          y: selectMode ? 0 : -8,
        }}
        transition={{ duration: 0.2 }}
      />
      {/* Middle Line */}
      <motion.span
        className="absolute w-6 h-0.5 bg-gray-700"
        initial={false}
        animate={{
          opacity: selectMode ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
      {/* Bottom Line */}
      <motion.span
        className="absolute w-6 h-0.5 bg-gray-700"
        initial={false}
        animate={{
          rotate: selectMode ? -45 : 0,
          y: selectMode ? 0 : 8,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  )}
</AnimatePresence>


  {/* Center Title (hidden while searching) */}
  {!showSearch && !selectMode && (
    <h1
  className="text-xl sm:text-lg md:text-xl font-bold cursor-pointer transition-opacity duration-200 truncate whitespace-nowrap"
  onClick={() => {
    setSelectMode(false);
    setSelected([]);
  }}
  style={{ maxWidth: "50vw" }}
>
  Resell
</h1>

  )}

  {/* Expanding Search Box (inline, smooth, fixed) */}
  <div className="flex-1" />
  <div
    className={`transition-all duration-300 flex items-center overflow-hidden ${
      showSearch ? "w-80 opacity-100 scale-100" : "w-0 opacity-0 scale-95"
    }`}
  >
    <div className="relative w-full h-9">
      <input
        type="text"
        placeholder="Search..."
        className="w-full h-full px-3 pr-8 text-sm border border-gray-300 rounded-md shadow-inner bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        ref={searchInputRef}
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      )}
    </div>
  </div>

  {/* Fixed Icons: Search, Filter, Share etc. */}
  <div className="relative flex items-center gap-2 shrink-0 ml-2">
    {/* Search Toggle Button */}
    <button
      onClick={() => setShowSearch((prev) => !prev)}
      className="text-xl text-gray-600 hover:text-black"
      title="Search"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M16.5 16.5A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012 12z"
        />
      </svg>
    </button>

    {/* Filter Button */}
    <button
      onClick={() => setShowFilters(true)}
      className="text-xl text-gray-600 hover:text-black"
      title="Filter"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 10h12M10 15h4" />
      </svg>
    </button>
    <button
  onClick={() => setShowInfo((prev) => !prev)}
  className="text-gray-600 hover:text-black p-1"
  title={showInfo ? "Hide Info" : "Show Info"}
>
  {showInfo ? (
    // Eye (visible)
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    // Eye Off (hidden)
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a10.05 10.05 0 012.852-4.41M9.88 9.88a3 3 0 104.24 4.24" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  )}
</button>


    {/* Other buttons like share, select/deselect, count… */}
    {selectMode && (
      <>   
        <button
          onClick={() =>
            setSelected(
              selected.length === visibleProducts.length
                ? []
                : visibleProducts.map((p) => p.id)
            )
          }
          className="text-gray-600 hover:text-black"
          title={selected.length === visibleProducts.length ? "Deselect All" : "Select All"}
        >
          {selected.length === visibleProducts.length ? (
    // Deselect (X mark)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
    >
      <g>
        <rect x="5" y="5" width="14" height="14" rx="2" ry="2" fill="gray" />
        <rect x="3" y="3" width="14" height="14" rx="2" ry="2" fill="gray" opacity="0.7" />
        <rect x="1" y="1" width="14" height="14" rx="2" ry="2" fill="gray" opacity="0.4" />
        <path
           d="M10 10 L14 14 M14 10 L10 14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ) : (
    // Select (✓ mark)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
    >
      <g>
        <rect x="5" y="5" width="14" height="14" rx="2" ry="2" fill="gray" />
        <rect x="3" y="3" width="14" height="14" rx="2" ry="2" fill="gray" opacity="0.7" />
        <rect x="1" y="1" width="14" height="14" rx="2" ry="2" fill="gray" opacity="0.4" />
        <path
          d="M8.5 12.5l2 2 5-5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )}
        </button>

        <span className="ml-2 text-[11px] px-2.5 py-1 bg-red-500 text-white font-semibold rounded-2xl shadow-md relative before:content-[''] before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-r-red-500">
  {selected.length}
</span>
<button
  onClick={async () => {
    await handleShare({
      selected,
      setProcessing,
      setProcessingIndex,
      setProcessingTotal,
      mode: "resell",
    });
  }}
  className="w-9 h-9 flex items-center justify-center rounded-md text-green-600 hover:text-green-700 transition-colors"
  title="Share"
>
  <svg
    className="w-[20px] h-[20px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M22 2L11 13"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M22 2L15 22L11 13L2 9L22 2Z"
    />
  </svg>
</button>

      </>
    )}
  </div>
</header>




     {/* Modern Filter Drawer Slide-In */}
<div
  className={`fixed inset-0 z-40 transition duration-300 ${
    showFilters ? "opacity-100" : "opacity-0 pointer-events-none"
  }`}
>
  {/* Backdrop */}
<div
  className="absolute inset-0 z-0 bg-black/90"
  style={{
    opacity: showFilters ? 1 : 0,
    transition: "opacity 300ms ease",
    pointerEvents: showFilters ? "auto" : "none",
  }}
  onClick={() => setShowFilters(false)}
></div>


  {/* Bottom Sheet */}
  <div
    className={`absolute bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ${
      showFilters ? "translate-y-0" : "translate-y-full"
    }`}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="px-5 py-4">
      {/* Pull handle */}
      <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800">Filter</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-gray-500 text-xl font-light"
        >
          &times;
        </button>
      </div>

      {/* Stock Toggle */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
        <div className="flex gap-2">
          {["in", "out"].map((type) => (
            <button
              key={type}
              onClick={() =>
                setStockFilter((prev) =>
                  prev.includes(type)
                    ? prev.filter((v) => v !== type)
                    : [...prev, type]
                )
              }
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                stockFilter.includes(type)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {type === "in" ? "In Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Category Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
</div>

    

<div className="fixed inset-x-0 bottom-0 overflow-y-auto px-0 pb-28" style={{ top: "calc(40px + 56px)" }}>
      {/* Grid */}
      <div
        id="capture-area"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 select-none"
      >
        {visibleProducts.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <div
              key={p.id}
              data-id={p.id}
              className={`share-card bg-white rounded-sm shadow-sm overflow-hidden relative cursor-pointer transition-all duration-200 ${
                !p.resellStock ? "opacity-100" : ""
              }`}
              onClick={() => handleCardClick(p.id)}
onTouchStart={(e) => handleTouchStart(e, p.id)}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}
onMouseDown={(e) => handleTouchStart(e, p.id)}
onMouseMove={handleTouchMove}
onMouseUp={handleTouchEnd}
onMouseLeave={handleTouchEnd}

            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={imageMap[p.id]}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                {!p.resellStock && (
                  <div className="absolute top-1/2 left-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] bg-red-500 bg-opacity-60 text-white text-center py-0.5 shadow-md">
                    <span className="block text-sm font-bold tracking-wider">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
                

<AnimatePresence>
  {isSelected && (
    <>
      {/* Gray overlay with fade-out */}
      <motion.div
        key="overlay"
        className="absolute inset-0 z-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: "black" }}
      />

      {/* Tick animation */}
      <div className="absolute inset-0 flex items-center justify-center z-6">
        <motion.div
          key="tick"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-white/40 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(19, 145, 67, 0.45)",
            userSelect: "none",
          }}
        >
          <HiCheck className="text-green-100" style={{ fontSize: 30 }} />
        </motion.div>
      </div>
    </>
  )}
</AnimatePresence>

              </div>
              
{/* Price Badge Over Image */}
{showInfo && (
<div
  className="absolute top-1.5 right-1.5 bg-green-800 text-white text-[11px] font-medium px-2 py-0.45 rounded-full shadow-md tracking-wide z-10"
>
  ₹{p.resell}
</div>
)}


{/* Name Below Image */}
{showInfo && (
<div
  className="absolute bottom-0 left-0 w-full px-1 py-1 text-center font-medium text-white text-[11px] sm:text-[12px] md:text-[14px] truncate"
  style={{
    backgroundColor: "rgba(0, 0, 0, 0.45)", // consistent overlay
    backdropFilter: "blur(1px)",
  }}
>
  {p.name}
</div>
)}

             

              {/* Share Preview Content */}
              <div
                className={`hidden full-detail-${p.id}`}
                style={{
                  width: "100%",
                  padding: 0,
                  margin: 0,
                  overflow: "hidden",
    boxSizing: "border-box",
    backgroundColor: "#fff",
                }}
              >
                <h2
                  style={{
                    backgroundColor: p.bgColor || "#add8e6",
                    color: p.fontColor || "white",
                    padding: 5,
                    textAlign: "center",
                    fontWeight: "normal",
                    fontSize: 19,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{p.resell}{" "}
                  {p.resellUnit}
                </h2>

                <div
                  style={{
                    backgroundColor: p.imageBgColor || "white",
                    padding: "16px",
                    textAlign: "center",
                    position: "relative",
                    boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4  )", // ⬅️ shadow BELOW
                  }}
                >
                  <img
      src={imageMap[p.id]}
      alt={p.name}
      style={{
        maxWidth: "100%",
        maxHeight: "300px",
        objectFit: "contain",
        margin: "0 auto",
                    }}
                  />
                  {p.badge && (
  <div
    style={{
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor:
        p.imageBgColor?.toLowerCase() === "white" ? "#fff" : "#000",
      color:
        p.imageBgColor?.toLowerCase() === "white" ? "#000" : "#fff",
      fontSize: 12,
      fontWeight: 600,
      padding: "5px 10px",
      borderRadius: "999px",
      opacity: 0.95,
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      border: `1px solid ${
        p.imageBgColor?.toLowerCase() === "white"
          ? "rgba(0,0,0,0.4)"
          : "rgba(255,255,255,0.4)"
      }`,
      letterSpacing: "0.4px",
    }}
  >
    {p.badge.toUpperCase()}
  </div>
)}


                  {!p.resellStock && (
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
                      }}
                    >
                      OUT OF STOCK
                    </div>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: getLighterColor(p.bgColor || "#add8e6"),
                    color: p.fontColor || "white",
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
                      {p.name}
                    </p>
                    {p.subtitle && (
                      <p
                        style={{ fontStyle: "italic", fontSize: 18, margin: 5 }}
                      >
                        ({p.subtitle})
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "left", lineHeight: 1.4 }}>
                    <p style={{ margin: "2px 0" }}>
                      &nbsp; Colour
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      &nbsp;&nbsp;{p.color}
                    </p>
                    <p style={{ margin: "2px 0" }}>
                      &nbsp; Package &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      &nbsp;&nbsp;{p.package} {p.packageUnit}
                    </p>
                    <p style={{ margin: "2px 0" }}>
                      &nbsp; Age Group &nbsp;&nbsp;: &nbsp;&nbsp;{p.age}{" "}
                      {p.ageUnit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {processing && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-xl px-6 py-4 text-center animate-fadeIn space-y-3 w-64">
      <div className="text-lg font-semibold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
        🖼️ Creating image {processingIndex} of {processingTotal}
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{
            width: `${(processingIndex / processingTotal) * 100 || 0}%`,
          }}
        ></div>
      </div>
      <div className="text-xs text-gray-400">Please wait…</div>
    </div>
  </div>
)}
    </div>
    </>
  );
}
