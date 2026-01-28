import React, { useState, useEffect } from "react";
import { type Catalogue } from "./config/catalogueConfig";
import {
  addCatalogue,
  updateCatalogue,
  deleteCatalogue,
  getAllCatalogues,
} from "./config/catalogueConfig";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { deleteRenderedImagesFromFolder, renameRenderedImagesForCatalogue } from "./Save";
import { FiX, FiPlus, FiEdit2, FiTrash2, FiImage, FiCheck } from "react-icons/fi";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Catalogue | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHeroImage, setFormHeroImage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const cats = getAllCatalogues();
    setCatalogues(cats);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFormHeroImage(base64String);
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const resetFormFields = () => {
    setFormLabel("");
    setFormDescription("");
    setFormHeroImage("");
    setFormError("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formLabel.trim()) {
      setFormError("Catalogue name is required");
      return;
    }

    if (catalogues.some((c) => c.label.toLowerCase() === formLabel.toLowerCase())) {
      setFormError("A catalogue with this name already exists");
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });

      const newCatalogue = addCatalogue(formLabel.trim(), {
        folder: formLabel.trim(),
        heroImage: formHeroImage,
        description: formDescription.trim(),
      });

      if (newCatalogue) {
        const updatedProducts = products.map((p) => ({
          ...p,
          [newCatalogue.stockField]: true,
          [newCatalogue.priceField]: "",
          [newCatalogue.priceUnitField]: "/ piece",
        }));
        setProducts(updatedProducts);
        localStorage.setItem("products", JSON.stringify(updatedProducts));

        const updated = getAllCatalogues();
        setCatalogues(updated);
        onCataloguesChanged(updated);

        setShowAddForm(false);
        resetFormFields();
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

      const newLabel = formLabel.trim();
      const oldFolder = showEditForm.folder;
      const oldLabel = showEditForm.label;
      const newFolder = newLabel;

      if (oldFolder !== newFolder || oldLabel !== newLabel) {
        console.log(`📁 Catalogue changed from "${oldLabel}" to "${newLabel}"`);
        await renameRenderedImagesForCatalogue(oldFolder, newFolder, oldLabel, newLabel);
      }

      const updates = {
        label: newLabel,
        folder: newFolder,
        heroImage: formHeroImage,
        description: formDescription.trim(),
      };
      updateCatalogue(showEditForm.id, updates);

      const updated = getAllCatalogues();
      setCatalogues(updated);
      onCataloguesChanged(updated);

      setShowEditForm(null);
      resetFormFields();
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
    setFormDescription(catalogue.description || "");
    setFormHeroImage(catalogue.heroImage || "");
    setShowEditForm(catalogue);
    setFormError("");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Catalogues</h2>
            <p className="text-blue-100 text-sm mt-1">Create, edit, and organize your catalogues</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            title="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Add New Catalogue Button */}
            {!showAddForm && !showEditForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setFormError("");
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <FiPlus size={20} />
                Add New Catalogue
              </button>
            )}

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Create New Catalogue</h3>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  {/* Catalogue Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Catalogue Name *
                    </label>
                    <input
                      type="text"
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder="e.g., Distributor, B2B, Retail"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Folder name will be set automatically</p>
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hero Image
                    </label>
                    {formHeroImage ? (
                      <div className="relative rounded-lg overflow-hidden mb-2">
                        <img src={formHeroImage} alt="Preview" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormHeroImage("")}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50 cursor-pointer hover:bg-blue-100 transition">
                        <FiImage size={24} className="text-blue-500 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Click to upload image</span>
                        <span className="text-xs text-gray-500 mt-1">Max 2MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Add a description for this catalogue..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Error Message */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
                      <span className="text-red-600 text-sm">{formError}</span>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <FiCheck size={18} />
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        resetFormFields();
                      }}
                      className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Form */}
            {showEditForm && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">Edit Catalogue</h3>
                  {showEditForm.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                      Default
                    </span>
                  )}
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Catalogue Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Catalogue Name *
                    </label>
                    <input
                      type="text"
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Folder name will be set automatically</p>
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hero Image
                    </label>
                    {formHeroImage ? (
                      <div className="relative rounded-lg overflow-hidden mb-2">
                        <img src={formHeroImage} alt="Preview" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormHeroImage("")}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-6 bg-amber-50 cursor-pointer hover:bg-amber-100 transition">
                        <FiImage size={24} className="text-amber-500 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Click to upload image</span>
                        <span className="text-xs text-gray-500 mt-1">Max 2MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Add a description for this catalogue..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Error Message */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
                      <span className="text-red-600 text-sm">{formError}</span>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <FiCheck size={18} />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(null);
                        resetFormFields();
                      }}
                      className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Catalogues List */}
            {!showAddForm && !showEditForm && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Your Catalogues ({catalogues.length})
                </h3>

                {catalogues.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No catalogues yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {catalogues.map((catalogue) => (
                      <div
                        key={catalogue.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white group"
                      >
                        {/* Hero Image */}
                        {catalogue.heroImage && (
                          <div className="w-full h-40 bg-gray-200 overflow-hidden">
                            <img
                              src={catalogue.heroImage}
                              alt={catalogue.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-gray-900">
                                  {catalogue.label}
                                </h4>
                                {catalogue.isDefault && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                                    Default
                                  </span>
                                )}
                              </div>
                              {catalogue.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {catalogue.description}
                                </p>
                              )}
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <p>
                                  <span className="font-medium">Folder:</span>{" "}
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                    {catalogue.folder}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium">Fields:</span>{" "}
                                  <span className="font-mono">
                                    {catalogue.priceField}, {catalogue.stockField}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => openEditForm(catalogue)}
                              className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2 active:scale-95"
                            >
                              <FiEdit2 size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(catalogue)}
                              disabled={catalogue.isDefault}
                              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 active:scale-95 ${
                                catalogue.isDefault
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              <FiTrash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-11/12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 px-6 py-6 border-b border-red-200">
              <h3 className="text-xl font-bold text-red-700">Delete Catalogue?</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900">"{showDeleteConfirm.label}"</span>?
              </p>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">⚠️ Note:</span> Product data will not be deleted, but this
                  catalogue will no longer be accessible.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
