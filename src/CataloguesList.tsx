import React, { useState, useEffect } from "react";
import { type Catalogue } from "./config/catalogueConfig";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface CataloguesListProps {
  catalogues: Catalogue[];
  onSelectCatalogue: (catalogueId: string) => void;
  imageMap: Record<string, string>;
  products: any[];
  onManageCatalogues: () => void;
}

export default function CataloguesList({
  catalogues,
  onSelectCatalogue,
  imageMap,
  products,
  onManageCatalogues,
}: CataloguesListProps) {
  const [catalogueStats, setCatalogueStats] = useState<
    Record<string, { total: number; inStock: number }>
  >({});

  useEffect(() => {
    // Calculate stats for each catalogue
    const stats: Record<string, { total: number; inStock: number }> = {};

    for (const cat of catalogues) {
      const total = products.length;
      const inStock = products.filter((p) => (p as any)[cat.stockField]).length;
      stats[cat.id] = { total, inStock };
    }

    setCatalogueStats(stats);
  }, [catalogues, products]);

  const handleCatalogueClick = async (catalogueId: string) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onSelectCatalogue(catalogueId);
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          All Catalogues
        </h2>
        <p className="text-sm text-gray-500">
          Tap a catalogue to view and manage its products
        </p>
      </div>

      {catalogues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No catalogues available</p>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {catalogues.map((catalogue) => {
            const stats = catalogueStats[catalogue.id] || {
              total: 0,
              inStock: 0,
            };
            // Get first few product images for this catalogue
            const catalogueProducts = products
              .filter((p) => (p as any)[catalogue.stockField] !== undefined)
              .slice(0, 3);

            return (
              <button
                key={catalogue.id}
                onClick={() => handleCatalogueClick(catalogue.id)}
                className="w-full group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 hover:border-blue-300"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-4 flex items-center gap-4">
                  {/* Image preview thumbnails */}
                  <div className="flex gap-1">
                    {catalogueProducts.length > 0 ? (
                      catalogueProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0"
                        >
                          {imageMap[product.id] ? (
                            <img
                              src={imageMap[product.id]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              No image
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-16 h-16 rounded border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-gray-400">
                          No products
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Catalogue info */}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {catalogue.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total} products · {stats.inStock} in stock
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Price: <span className="font-mono">{catalogue.priceField}</span>
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400 group-hover:text-blue-600 transition-colors text-xl">
                    →
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
