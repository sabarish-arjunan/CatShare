import React, { useState, useEffect } from "react";
import { type Catalogue } from "./config/catalogueConfig";
import {
  addCatalogue,
  updateCatalogue,
  deleteCatalogue,
  getAllCatalogues,
} from "./config/catalogueConfig";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface ManageCataloguesProps {
  onClose: () => void;
  onCataloguesChanged: (catalogues: Catalogue[]) => void;
  products: any[];
  setProducts: (products: any[]) => void;
}

export default function ManageCatalogues({
  onClose,
  onCataloguesChanged,
  products,
  setProducts,
}: ManageCataloguesProps) {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Catalogue | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Catalogue | null>(
    null
  );

  const [formLabel, setFormLabel] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const cats = getAllCatalogues();
    setCatalogues(cats);
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formLabel.trim()) {
      setFormError("Catalogue name is required");
      return;
    }

    // Check for duplicate labels
    if (catalogues.some((c) => c.label.toLowerCase() === formLabel.toLowerCase())) {
      setFormError("A catalogue with this name already exists");
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });

      // Create new catalogue with folder name same as label
      const newCatalogue = addCatalogue(formLabel.trim(), {
        folder: formLabel.trim(),
      });

      if (newCatalogue) {
        // Update products with new stock and price fields
        const updatedProducts = products.map((p) => ({
          ...p,
          [newCatalogue.stockField]: true, // Default to in-stock
          [newCatalogue.priceField]: "",
          [newCatalogue.priceUnitField]: "/ piece",
        }));
        setProducts(updatedProducts);
        localStorage.setItem("products", JSON.stringify(updatedProducts));

        // Refresh catalogues list
        const updated = getAllCatalogues();
        setCatalogues(updated);
        onCataloguesChanged(updated);

        setShowAddForm(false);
        setFormLabel("");
      }
    } catch (err) {
      setFormError("Failed to add catalogue: " + (err as Error).message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formLabel.trim()) {
      setFormError("Catalogue name is required");
      return;
    }

    if (!showEditForm) return;

    // Check for duplicate labels (excluding current catalogue)
    if (
      catalogues.some(
        (c) =>
          c.id !== showEditForm.id &&
          c.label.toLowerCase() === formLabel.toLowerCase()
      )
    ) {
      setFormError("A catalogue with this name already exists");
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });

      // Update label and folder (folder = label for all catalogues)
      const updates = { label: formLabel.trim(), folder: formLabel.trim() };
      updateCatalogue(showEditForm.id, updates);

      const updated = getAllCatalogues();
      setCatalogues(updated);
      onCataloguesChanged(updated);

      setShowEditForm(null);
      setFormLabel("");
    } catch (err) {
      setFormError("Failed to update catalogue: " + (err as Error).message);
    }
  };

  const handleDeleteConfirm = async (catalogue: Catalogue) => {
    if (!catalogue) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });

      const success = deleteCatalogue(catalogue.id);
      if (success) {
        const updated = getAllCatalogues();
        setCatalogues(updated);
        onCataloguesChanged(updated);
        setShowDeleteConfirm(null);
      } else {
        setFormError("Cannot delete default catalogues");
      }
    } catch (err) {
      setFormError("Failed to delete catalogue: " + (err as Error).message);
    }
  };

  const openEditForm = (catalogue: Catalogue) => {
    setFormLabel(catalogue.label);
    setShowEditForm(catalogue);
    setFormError("");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Manage Catalogues</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-red-500 transition"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Add Button */}
          <button
            onClick={() => {
              setShowAddForm(true);
              setFormError("");
            }}
            className="w-full py-3 mb-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Add New Catalogue
          </button>

          {/* Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="mb-4 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg"
            >
              <h3 className="font-semibold text-gray-800 mb-3">
                Create New Catalogue
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catalogue Name
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g., Distributor, B2B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value)}
                    placeholder="e.g., Distributor (for saved images)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formError && (
                  <div className="p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormLabel("");
                      setFormFolder("");
                      setFormError("");
                    }}
                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {showEditForm && (
            <form
              onSubmit={handleEditSubmit}
              className="mb-4 p-4 border-2 border-amber-200 bg-amber-50 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  Edit Catalogue
                </h3>
                {showEditForm.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catalogue Name
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value)}
                    disabled={showEditForm?.isDefault}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  {showEditForm?.isDefault && (
                    <p className="text-xs text-gray-500 mt-1">Folder name cannot be changed for default catalogues</p>
                  )}
                </div>

                {formError && (
                  <div className="p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(null);
                      setFormLabel("");
                      setFormFolder("");
                      setFormError("");
                    }}
                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Catalogues List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">
              All Catalogues ({catalogues.length})
            </h3>

            {catalogues.map((catalogue) => (
              <div
                key={catalogue.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {catalogue.label}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Folder: <span className="font-mono">{catalogue.folder}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Fields:{" "}
                      <span className="font-mono">
                        {catalogue.priceField}, {catalogue.stockField}
                      </span>
                    </p>
                  </div>

                  {catalogue.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditForm(catalogue)}
                    className="flex-1 py-1.5 text-sm rounded font-medium transition bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(catalogue)}
                    disabled={catalogue.isDefault}
                    className={`flex-1 py-1.5 text-sm rounded font-medium transition ${
                      catalogue.isDefault
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-11/12"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-red-600 mb-3">Delete Catalogue?</h3>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">"{showDeleteConfirm.label}"</span>?
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
              <p className="text-xs text-red-800">
                <span className="font-semibold">⚠️ Important:</span> Product data
                will not be deleted, but this catalogue will no longer be
                accessible. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
