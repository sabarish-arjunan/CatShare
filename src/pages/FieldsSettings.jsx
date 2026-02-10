import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdRefresh, MdDragIndicator, MdAdd, MdCheckCircle, MdInfoOutline } from "react-icons/md";
import { FiTrash2, FiSettings, FiBriefcase } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  getFieldsDefinition,
  setFieldsDefinition,
  resetToDefaultFields
} from "../config/fieldConfig";
import { getAllCatalogues } from "../config/catalogueConfig";
import { INDUSTRY_PRESETS } from "../config/industryPresets";
import { useToast } from "../context/ToastContext";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export default function FieldsSettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [definition, setDefinition] = useState(null);
  const [activePriceFields, setActivePriceFields] = useState([]);
  const [activeTab, setActiveTab] = useState("product-fields"); // "product-fields" or "price-fields"
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const def = getFieldsDefinition();
    setDefinition(def);

    // Determine which price fields are actually in use by catalogues
    const catalogues = getAllCatalogues();
    const usedPriceFields = catalogues.map(c => c.priceField);
    setActivePriceFields(usedPriceFields);
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination || !definition) return;

    const items = Array.from(definition.fields);

    // Find the indices in the full fields array
    const sourceField = filteredFields[result.source.index];
    const destField = filteredFields[result.destination.index];

    const sourceIndex = items.findIndex(f => f.key === sourceField.key);
    const destIndex = items.findIndex(f => f.key === destField.key);

    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);

    setDefinition({ ...definition, fields: items });
  };

  const handleSave = async () => {
    if (definition) {
      setFieldsDefinition(definition);
      window.dispatchEvent(new Event('storage'));
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {}
      showToast("Field settings saved successfully", "success");
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset all fields to default settings? This will overwrite your current configuration.")) {
      resetToDefaultFields();
      setDefinition(getFieldsDefinition());
      window.dispatchEvent(new Event('storage'));
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {}
      showToast("Fields reset to defaults", "info");
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

  const updateIndustry = async (industry) => {
    if (!definition) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}

    const preset = INDUSTRY_PRESETS.find(p => p.name === industry);
    let newFields = [...definition.fields];
    
    if (preset) {
      newFields = newFields.map(f => {
        if (f.key.startsWith('field')) {
          const index = parseInt(f.key.replace('field', '')) - 1;
          const presetField = preset.fields[index];
          if (presetField) {
            return {
              ...f,
              label: presetField.label,
              unitOptions: presetField.defaultUnits || f.unitOptions || [],
              enabled: true
            };
          } else {
            // Keep existing fields if they were enabled but aren't in the preset?
            // Actually, the user said "choose what to stay and what not", 
            // but industry preset should probably set a baseline.
            return { ...f, enabled: false };
          }
        }
        return f;
      });
    } else {
      // General/Custom - keep everything as is or enable first 3
      newFields = newFields.map(f => {
        if (f.key.startsWith('field')) {
          const index = parseInt(f.key.replace('field', ''));
          return { ...f, enabled: index <= 3 || f.enabled };
        }
        return f;
      });
    }

    setDefinition({ ...definition, industry, fields: newFields });
  };

  const toggleFieldEnabled = async (key) => {
    if (!definition) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}

    const newFields = definition.fields.map(f =>
      f.key === key ? { ...f, enabled: !f.enabled } : f
    );
    setDefinition({ ...definition, fields: newFields });
  };

  if (!definition) return null;

  const productFields = definition.fields.filter(f => f.key.startsWith('field'));
  const priceFields = definition.fields.filter(f => f.key.startsWith('price') && activePriceFields.includes(f.key));
  
  const filteredFields = activeTab === "product-fields" ? productFields : priceFields;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* iOS-style Status Bar Area */}
      <div className="h-10 bg-white dark:bg-gray-900 shrink-0"></div>

      {/* Modern Header */}
      <header className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdArrowBack size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Product Fields</h1>
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest">Configuration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
            title="Reset to defaults"
          >
            <MdRefresh size={22} />
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <MdSave size={18} />
            Save
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24" ref={scrollContainerRef}>
        {/* Industry Selection Section */}
        <section className="mt-4 px-4">
          <div className="flex items-center gap-2 mb-3">
            <FiBriefcase className="text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Industry Templates</h2>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide no-scrollbar">
            <button
              onClick={() => updateIndustry("General Products (Custom)")}
              className={`shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1 items-start min-w-[140px] ${
                definition.industry === "General Products (Custom)" || !definition.industry
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="text-lg mb-1">📦</div>
              <span className="font-bold text-sm">Custom</span>
              <span className="text-[10px] opacity-70">Flexible fields</span>
            </button>
            
            {INDUSTRY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateIndustry(preset.name)}
                className={`shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1 items-start min-w-[140px] ${
                  definition.industry === preset.name
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="text-lg mb-1">
                  {preset.name.includes("Fashion") ? "👕" : 
                   preset.name.includes("Lifestyle") ? "🧴" : 
                   preset.name.includes("Home") ? "🏠" : 
                   preset.name.includes("Electronics") ? "🎧" : "🛠️"}
                </div>
                <span className="font-bold text-sm truncate w-full text-left">{preset.name.split(" ")[0]}</span>
                <span className="text-[10px] opacity-70">{preset.fields.length} Fields</span>
              </button>
            ))}
          </div>
        </section>

        {/* Tabs for Fields */}
        <div className="mt-6 px-4">
          <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab("product-fields")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "product-fields" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              PRODUCT FIELDS
            </button>
            <button
              onClick={() => setActiveTab("price-fields")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "price-fields" 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              PRICE FIELDS
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mx-4 mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
          <MdInfoOutline className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            {activeTab === "product-fields"
              ? "Enable up to 10 custom fields for your products. Drag handles to reorder. Changes apply to all products immediately."
              : "Price fields are linked to your catalogues. You can rename them to match your pricing strategy (e.g. 'Retail', 'Wholesale')."}
          </p>
        </div>

        {/* Fields List */}
        <div className="mt-6 px-4 pb-20">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredFields.map((field, index) => (
                      <motion.div
                        key={field.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Draggable draggableId={field.key} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              layout={!snapshot.isDragging}
                              className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all ${
                                snapshot.isDragging ? "shadow-2xl ring-2 ring-blue-500 z-50 scale-[1.02]" : ""
                              } ${
                                field.enabled
                                  ? "border-blue-200 dark:border-blue-900 shadow-sm"
                                  : "border-gray-200 dark:border-gray-800 opacity-60 grayscale-[0.5]"
                              }`}
                            >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${
                                      field.enabled ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                    }`}
                                  >
                                    <MdDragIndicator size={20} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                      {field.key.startsWith('field') ? `Product Slot ${field.key.replace('field', '')}` : `Catalogue Price`}
                                    </span>
                                    <h3 className="font-bold text-sm dark:text-white">
                                      {field.label || "Untitled Field"}
                                    </h3>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleFieldEnabled(field.key)}
                                    className={`w-12 h-6 rounded-full p-1 transition-all ${
                                      field.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                                    }`}
                                  >
                                    <motion.div
                                      animate={{ x: field.enabled ? 24 : 0 }}
                                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                  </button>
                                </div>
                              </div>

                              {field.enabled ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                      Display Label
                                    </label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => updateFieldLabel(field.key, e.target.value)}
                                      placeholder="e.g. Colour, Size, Brand..."
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-all dark:text-white"
                                    />
                                  </div>

                                  {field.key.startsWith('field') && (
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                        Unit Options
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={field.unitOptions?.join(", ") || ""}
                                          onChange={(e) => updateFieldUnits(field.key, e.target.value)}
                                          placeholder="e.g. kg, lbs, meters (comma separated)"
                                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-all dark:text-white pr-10"
                                        />
                                        {field.unitOptions && field.unitOptions.length > 0 && (
                                          <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="py-1 flex items-center gap-2 text-gray-400 italic text-xs">
                                  <span>This field is hidden from product forms</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    </motion.div>
                  ))}
                    {provided.placeholder}
                  </AnimatePresence>
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {activeTab === "product-fields" && productFields.every(f => !f.enabled) && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center text-center px-6"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MdAdd size={32} className="text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white">No Active Fields</h3>
              <p className="text-sm text-gray-500 mt-2">
                Enable some fields above or select an industry template to get started.
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating Save Button for Mobile */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-0 right-0 px-6 z-40 lg:hidden pointer-events-none"
      >
        <button
          onClick={handleSave}
          className="w-full h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all pointer-events-auto"
        >
          <MdSave size={24} />
          <span className="font-bold">Apply Changes</span>
        </button>
      </motion.div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
