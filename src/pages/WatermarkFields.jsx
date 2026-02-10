import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdRefresh } from "react-icons/md";
import {
  getFieldsDefinition,
  setFieldsDefinition,
  resetToDefaultFields
} from "../config/fieldConfig";
import { getAllCatalogues } from "../config/catalogueConfig";

export default function WatermarkFields() {
  const navigate = useNavigate();
  const [definition, setDefinition] = useState(null);
  const [activePriceFields, setActivePriceFields] = useState([]);

  useEffect(() => {
    setDefinition(getFieldsDefinition());

    // Determine which price fields are actually in use by catalogues
    const catalogues = getAllCatalogues();
    const usedPriceFields = catalogues.map(c => c.priceField);
    setActivePriceFields(usedPriceFields);
  }, []);

  const handleSave = () => {
    if (definition) {
      setFieldsDefinition(definition);
      // Trigger a storage event so other components can react if they listen to it
      window.dispatchEvent(new Event('storage'));
      alert("Fields saved successfully! These changes will reflect across the app.");
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all fields to default settings?")) {
      resetToDefaultFields();
      setDefinition(getFieldsDefinition());
      window.dispatchEvent(new Event('storage'));
    }
  };

  const updateFieldLabel = (key, label) => {
    if (!definition) return;
    const newFields = definition.fields.map(f =>
      f.key === key ? { ...f, label } : f
    );
    setDefinition({ ...definition, fields: newFields });
  };

  const updateFieldUnits = (key, unitsString) => {
    if (!definition) return;
    const unitOptions = unitsString.split(',').map(u => u.trim()).filter(u => u !== "");
    const newFields = definition.fields.map(f =>
      f.key === key ? { ...f, unitOptions } : f
    );
    setDefinition({ ...definition, fields: newFields });
  };

  if (!definition) return null;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 dark:bg-gray-950 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
          aria-label="Back"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center dark:text-white">Fields Configuration</h1>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-orange-500 transition"
            title="Reset to defaults"
          >
            <MdRefresh size={22} />
          </button>
          <button
            onClick={handleSave}
            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 transition"
            title="Save changes"
          >
            <MdSave size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Configure the names and units for product fields. These labels will be used in previews,
              catalogues, and rendered images.
            </p>
          </div>

          <div className="space-y-4 pb-20">
            {definition.fields
              .filter(field => {
                // Always show custom fields (field1, field2, etc.)
                if (field.key.startsWith('field')) return true;
                // Only show price fields if they are linked to an active catalogue
                if (field.key.startsWith('price')) {
                  return activePriceFields.includes(field.key);
                }
                return true; // Show other fields by default
              })
              .map((field) => (
              <div
                key={field.key}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Internal ID: {field.key}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFieldLabel(field.key, e.target.value)}
                      placeholder="e.g. Colour, Size, Material"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>

                  {field.unitField && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                        Unit Options (comma separated)
                      </label>
                      <input
                        type="text"
                        value={field.unitOptions?.join(", ") || ""}
                        onChange={(e) => updateFieldUnits(field.key, e.target.value)}
                        placeholder="e.g. kg, lbs, meters"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      />
                      <p className="mt-1 text-[10px] text-gray-400">
                        Leave empty if no units are needed for this field.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Save FAB for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={handleSave}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
        >
          <MdSave size={28} />
        </button>
      </div>
    </div>
  );
}
