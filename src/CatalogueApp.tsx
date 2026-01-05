import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiTrash2, FiEdit, FiMenu } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SideDrawer from "./SideDrawer";
import WholesaleTab from "./Wholesale";
import ResellTab from "./Resell";
import ProductPreviewModal from "./ProductPreviewModal";
import Tutorial from "./Tutorial";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { MdInventory2 } from "react-icons/md";

export function openPreviewHtml(id, tab = null) {
  const evt = new CustomEvent("open-preview", { detail: { id, tab } });
  window.dispatchEvent(evt);
}

export default function CatalogueApp({ products, setProducts, deletedProducts, setDeletedProducts }) {

  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [tab, setTab] = useState("products");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewList, setPreviewList] = useState([]);
  const [imageMap, setImageMap] = useState({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showShelfConfirm, setShowShelfConfirm] = useState(false);
  const [shelfTarget, setShelfTarget] = useState(null);
  const [confirmToggleStock, setConfirmToggleStock] = useState(null);
  const [bypassChecked, setBypassChecked] = useState(false);

  // Logo fullscreen state
  const [showLogoFullscreen, setShowLogoFullscreen] = useState(false);
  const logoFsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showLogoFullscreen && logoFsRef.current && !document.fullscreenElement) {
      const el = logoFsRef.current as any;
      if (el && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setShowLogoFullscreen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showLogoFullscreen]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const toggleSort = () => setShowSortMenu((prev) => !prev);
    window.addEventListener("toggle-sort", toggleSort);
    return () => window.removeEventListener("toggle-sort", toggleSort);
  }, []);

  const handleSort = (type) => {
    setSortBy(type);
    setShowSortMenu(false);
  };

  useEffect(() => {
    const loadImages = async () => {
      const map = {};
      for (const p of products) {
        if (p.imagePath) {
          try {
            const result = await Filesystem.readFile({ path: p.imagePath, directory: Directory.Data });
            map[p.id] = `data:image/png;base64,${result.data}`;
          } catch {
            map[p.id] = p.image || "";
          }
        } else {
          map[p.id] = p.image || "";
        }
      }
      setImageMap(map);
    };
    loadImages();
  }, [products]);

  useEffect(() => {
    const openMenu = () => setMenuOpen(true);
    const toggleSearch = () => setShowSearch((prev) => !prev);

    window.addEventListener("toggle-menu", openMenu);
    window.addEventListener("toggle-search", toggleSearch);

    return () => {
      window.removeEventListener("toggle-menu", openMenu);
      window.removeEventListener("toggle-search", toggleSearch);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { id, tab, filtered } = e.detail || {};
      const list = filtered || products;
      const match = list.find((p) => p.id === id);
      if (match) {
        setTab(tab || "products");
        setPreviewList(list);
        setPreviewProduct(match);
      }
    };
    window.addEventListener("open-preview", handler);
    return () => window.removeEventListener("open-preview", handler);
  }, [products]);

  useEffect(() => {
    const handleNewProduct = () => {
      const updated = JSON.parse(localStorage.getItem("products") || "[]");
      setProducts(updated);
    };

    window.addEventListener("product-added", handleNewProduct);
    return () => window.removeEventListener("product-added", handleNewProduct);
  }, []);

  useEffect(() => {
    sessionStorage.removeItem("bypassStockWarningUntil");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const savedY = localStorage.getItem("productScroll");
      if (savedY && scrollRef.current) {
        scrollRef.current.scrollTop = parseInt(savedY, 10);
        localStorage.removeItem("productScroll");
      }
    }, 1);
    return () => clearTimeout(timeout);
  }, []);

  const handleTabChange = (key) => {
    setTab(key);
    setSelected([]);
    setSearch("");
  };

  const toggleStock = async (id, field) => {
    const label = field === "wholesaleStock" ? "Wholesale Stock" : "Resell Stock";
    const confirm = window.confirm(`Do you want to update ${label} for this item?`);
    if (!confirm) return;

    await Haptics.impact({ style: ImpactStyle.Medium });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleStockToggleRequest = (id, field) => {
    const bypassUntil = parseInt(sessionStorage.getItem("bypassStockWarningUntil") || "0", 10);
    const now = Date.now();

    if (now < bypassUntil) {
      // Bypassed within 5 minutes
      Haptics.impact({ style: ImpactStyle.Medium });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p))
      );
    } else {
      // Show confirmation
      setConfirmToggleStock({ id, field });
    }
  };

  const updateProduct = (item) => {
    setProducts((prev) => prev.map((p) => (p.id === item.id ? item : p)));
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;
    const toDelete = products.find((p) => p.id === id);
    if (toDelete) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeletedProducts((prev) => [toDelete, ...prev]);
    }
  };

  const handlePermanentDelete = (id) => {
    if (window.confirm("Permanently delete this item?")) {
      setDeletedProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

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
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    return color;
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q));
  });

  const visible = [...filtered];
  if (sortBy === "name") visible.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "wholesaleStock") visible.sort((a, b) => a.wholesaleStock ? -1 : 1);
  else if (sortBy === "resellStock") visible.sort((a, b) => a.resellStock ? -1 : 1);
  else if (sortBy === "category") visible.sort((a, b) => {
    const aCat = Array.isArray(a.category) ? a.category[0] || "" : a.category || "";
    const bCat = Array.isArray(b.category) ? b.category[0] || "" : b.category || "";
    return aCat.localeCompare(bCat);
  });

  return (
    <div
      className="w-full min-h-[100dvh] flex flex-col bg-gradient-to-b from-white to-gray-100 relative"
    >

      {tab === "products" && (
        <>
          <div className="sticky top-0 h-[40px] bg-black z-50"></div>
          <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`relative w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 transition-opacity duration-200 ${
              showSearch ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            aria-label="Menu"
            title="Menu"
          >
              <span className="absolute w-6 h-0.5 bg-gray-700" style={{ top: '50%', transform: 'translateY(-8px)' }} />
              <span className="absolute w-6 h-0.5 bg-gray-700" style={{ top: '50%', transform: 'translateY(0px)' }} />
              <span className="absolute w-6 h-0.5 bg-gray-700" style={{ top: '50%', transform: 'translateY(8px)' }} />
          </button>

          {/* Center Title */}
          {!showSearch && (
            <h1
              className="text-xl font-bold text-center flex-1 cursor-pointer transition-opacity duration-200 flex items-center justify-center leading-none"
              onClick={() => {
                setTab("products");
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLogoFullscreen(true);
                  }}
                  className="p-1 m-0 inline-flex items-center justify-center shrink-0"
                  aria-label="Open CatShare logo fullscreen"
                >
                  <img src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800" alt="Catalogue Share" className="w-10 h-10 sm:w-12 sm:h-12 rounded pointer-events-none object-contain shrink-0" />
                </button>
                <span>CatShare</span>
              </span>
            </h1>
          )}

          {showSortMenu && (
            <div
              className="absolute top-14 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-48 animate-dropdown overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { label: "Original", value: "" },
                { label: "A - Z", value: "name" },
                { label: "Wholesale IN", value: "wholesaleStock" },
                { label: "Resell IN", value: "resellStock" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value)}
                  className={`w-full text-left px-4 py-3 text-sm tracking-wide hover:bg-gray-50 transition-all ${
                    sortBy === option.value ? "bg-gray-100 font-semibold text-blue-600" : "text-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Flexible Spacer */}
          <div className="flex-1" />

          {/* Expanding Search Box (larger, smoother) */}
          <div
            className={`transition-all duration-300 flex items-center overflow-hidden ${
              showSearch ? "w-80 opacity-100 scale-10" : "w-0 opacity-0 scale-95"
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

          {/* Fixed Icons Group (Glass + Sort) */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              className="text-xl text-gray-600 hover:text-black"
              title="Search"
            >
              <FiSearch />
            </button>

            <button
              onClick={() => window.dispatchEvent(new Event("toggle-sort"))}
              className="text-xl text-gray-600 hover:text-black"
              title="Sort"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h8" />
              </svg>
            </button>
          </div>
        </header>
        </>
      )}

      {tab !== "products" && (
        <div className="sticky top-0 h-[40px] bg-black z-50"></div>
      )}

      <main ref={scrollRef} className={`flex-1 ${tab === 'products' ? 'overflow-y-auto' : ''} px-4 pb-24`}>
        {tab === "products" && (
          <DragDropContext onDragEnd={({ source, destination }) => {
            if (!destination) return;
            const copy = [...products];
            const [removed] = copy.splice(source.index, 1);
            copy.splice(destination.index, 0, removed);
            setProducts(copy);
          }}>
            <Droppable droppableId="product-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 mt-4">
                  {visible.map((p, index) => (
                    <Draggable key={p.id} draggableId={p.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white rounded-lg shadow p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                        >
                          {/* Left: Name + Subtitle + Drag + Image */}
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                              setPreviewProduct(p);
                              setPreviewList(visible);
                            }}
                          >
                            <div {...provided.dragHandleProps} className="text-gray-400 shrink-0">
                              ☰
                            </div>
                            <div className="w-14 h-14 rounded border bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                              {imageMap[p.id] ? (
                                <img
                                  src={imageMap[p.id]}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement.innerHTML =
                                      '<span class="text-[10px] text-gray-400">Failed to load</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400">Loading...</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{p.name}</div>
                              <div className="text-xs text-gray-500 truncate">{p.subtitle}</div>
                            </div>
                          </div>

                          {/* Buttons: Stay right even when wrapped on small screens */}
                          <div className="w-full sm:w-auto flex justify-end mt-3 sm:mt-0 sm:ml-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => {
                                  localStorage.setItem("productScroll", scrollRef.current?.scrollTop || 0);
                                  navigate(`/create?id=${p.id}`);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setShelfTarget(p);
                                  setShowShelfConfirm(true);
                                }}
                                className="text-red-500 hover:text-red-800"
                                title="Shelf Item"
                              >
                                <MdInventory2 className="text-[18px]" />
                              </button>

                              <button
                                onClick={() => handleStockToggleRequest(p.id, "wholesaleStock")}
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  p.wholesaleStock ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
                                }`}
                              >
                                {p.wholesaleStock ? "WS In" : "WS Out"}
                              </button>
                              <button
                                onClick={() => handleStockToggleRequest(p.id, "resellStock")}
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  p.resellStock ? "bg-amber-500 text-white" : "bg-gray-300 text-gray-700"
                                }`}
                              >
                                {p.resellStock ? "RS In" : "RS Out"}
                              </button>
                            </div>
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

        {showShelfConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => {
              setShowShelfConfirm(false);
              setShelfTarget(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Shelf this item now?
              </h2>
              <p className="text-sm text-gray-600 mb-5">
                It stays safe and can be restored or deleted later.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-800 transition"
                  onClick={async () => {
                    if (shelfTarget) {
                      await Haptics.impact({ style: ImpactStyle.Heavy });
                      setProducts((prev) => prev.filter((x) => x.id !== shelfTarget.id));
                      setDeletedProducts((prev) => [shelfTarget, ...prev]);
                    }
                    setShowShelfConfirm(false);
                    setShelfTarget(null);
                  }}
                >
                  Shelf
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition"
                  onClick={() => {
                    setShowShelfConfirm(false);
                    setShelfTarget(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmToggleStock && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Heads up!</h2>
              <p className="text-sm text-gray-600 mb-2">
                You're about to change stock status. Are you sure?
              </p>

              <label className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={bypassChecked}
                  onChange={(e) => setBypassChecked(e.target.checked)}
                />
                Don't show this again for 5 minutes
              </label>

              <div className="flex justify-center gap-4 mt-5">
                <button
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                  onClick={() => {
                    setConfirmToggleStock(null);
                    setBypassChecked(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                  onClick={() => {
                    const { id, field } = confirmToggleStock;

                    if (bypassChecked) {
                      sessionStorage.setItem("bypassStockWarningUntil", (Date.now() + 5 * 60 * 1000).toString());
                    }

                    Haptics.impact({ style: ImpactStyle.Medium });
                    setProducts((prev) =>
                      prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p))
                    );

                    setConfirmToggleStock(null);
                    setBypassChecked(false);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogoFullscreen && (
          <div
            ref={logoFsRef}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
            onClick={() => {
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
              setShowLogoFullscreen(false);
            }}
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800"
              alt="CatShare logo fullscreen"
              className="max-w-[92vw] max-h-[92vh] w-auto h-auto"
            />
          </div>
        )}

        {tab === "wholesale" && (
          <WholesaleTab
            filtered={visible}
            selected={selected}
            setSelected={setSelected}
            getLighterColor={getLighterColor}
            imageMap={imageMap}
          />
        )}

        {tab === "resell" && (
          <ResellTab
            filtered={visible}
            selected={selected}
            setSelected={setSelected}
            getLighterColor={getLighterColor}
            imageMap={imageMap}
          />
        )}

        {previewProduct && (
          <ProductPreviewModal
            product={previewProduct}
            tab={tab}
            filteredProducts={previewList}
            onClose={() => setPreviewProduct(null)}
            onEdit={() => navigate(`/create?id=${previewProduct.id}`)}
            onToggleStock={(field) => {
              const updated = { ...previewProduct, [field]: !previewProduct[field] };
              updateProduct(updated);
              setPreviewProduct(updated);
            }}
            onSwipeLeft={(next) => setPreviewProduct(next)}
            onSwipeRight={(prev) => setPreviewProduct(prev)}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around text-sm font-medium pb-[env(safe-area-inset-bottom,0px)]">
        {[
          { key: "products", label: "Products", color: "bg-blue-500 text-white" },
          { key: "wholesale", label: "Wholesale", color: "bg-blue-500 text-white" },
          { key: "resell", label: "Resell", color: "bg-blue-500 text-white" },
        ].map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                handleTabChange(t.key);
              }}
              className={`flex-1 py-3.5 text-center transition-all ${
                isActive ? t.color : "bg-white text-gray-600"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={async () => {
          await Haptics.impact({ style: ImpactStyle.Medium });
          navigate("/create");
        }}
        className="fixed right-4 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}
      >
        <FiPlus size={24} />
      </button>

      <SideDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        products={products}
        imageMap={imageMap}
        setProducts={setProducts}
        setDeletedProducts={setDeletedProducts}
        selected={selected}
      />
    </div>
  );
}
