import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdRefresh, MdDragIndicator, MdAdd, MdCheckCircle, MdInfoOutline, MdExpandMore } from "react-icons/md";
import { FiTrash2, FiSettings, FiBriefcase, FiCheck } from "react-icons/fi";
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
  const [savedDefinition, setSavedDefinition] = useState(null);
  const [activePriceFields, setActivePriceFields] = useState([]);
  const [activeTab, setActiveTab] = useState("templates"); // "templates" or "fields"
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedTemplateCard, setExpandedTemplateCard] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const def = getFieldsDefinition();
    setDefinition(def);
    setSavedDefinition(def);

    // Determine which price fields are actually in use by catalogues
    const catalogues = getAllCatalogues();
    const usedPriceFields = catalogues.map(c => c.priceField);
    setActivePriceFields(usedPriceFields);
  }, []);

  // Listen for backup restore events
  useEffect(() => {
    const handleBackupRestore = (event) => {
      const { newDefinition, template, isBackupRestore } = event.detail || {};

      if (isBackupRestore && newDefinition) {
        // Update local state with restored definition
        setDefinition(newDefinition);
        setSavedDefinition(newDefinition);

        // Switch to templates tab to show the restored template
        setActiveTab("templates");

        console.log(`✅ Auto-switched to restored template: ${template || 'Unknown'}`);
        showToast(`Template restored: ${template || 'Custom'}`, "success");
      }
    };

    window.addEventListener("fieldDefinitionsChanged", handleBackupRestore);
    return () => window.removeEventListener("fieldDefinitionsChanged", handleBackupRestore);
  }, [showToast]);

  const onDragEnd = (result) => {
    if (!result.destination || !definition) return;

    const items = Array.from(definition.fields);

    // Filtered list based on active price fields
    const productFields = items.filter(f => f.key.startsWith('field'));
    const priceFields = items.filter(f => f.key.startsWith('price') && activePriceFields.includes(f.key));
    const currentList = [...productFields, ...priceFields];

    const sourceField = currentList[result.source.index];
    const destField = currentList[result.destination.index];

    const sourceIndex = items.findIndex(f => f.key === sourceField.key);
    const destIndex = items.findIndex(f => f.key === destField.key);

    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);

    setDefinition({ ...definition, fields: items });
  };

  const handleSave = async () => {
    if (definition) {
      setFieldsDefinition(definition);
      setSavedDefinition(definition);
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
      const resetDef = getFieldsDefinition();
      setDefinition(resetDef);
      setSavedDefinition(resetDef);
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
            return { ...f, enabled: false };
          }
        }
        return f;
      });
    } else {
      newFields = newFields.map(f => {
        if (f.key.startsWith('field')) {
          const index = parseInt(f.key.replace('field', ''));
          return { ...f, enabled: index <= 3 || f.enabled };
        }
        return f;
      });
    }

    setDefinition({ ...definition, industry, fields: newFields });
    // Switch to fields tab after selecting template
    setActiveTab("fields");
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
  
  const allFields = [...productFields, ...priceFields];
  const activeProductFieldsCount = productFields.filter(f => f.enabled).length;
  const activePriceFieldsCount = priceFields.filter(f => f.enabled).length;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* iOS-style Status Bar Area */}
      <div className="h-10 bg-black shrink-0"></div>

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

      <main className="flex-1 overflow-y-auto pb-24 px-4" ref={scrollContainerRef}>
        {/* Current Configuration Summary Card - Shows SAVED configuration */}
        {savedDefinition && (
          <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
            <button
              onClick={() => setExpandedTemplateCard(!expandedTemplateCard)}
              className="w-full flex items-center justify-between mb-4 hover:opacity-75 transition-opacity"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center">
                  {savedDefinition.industry === "General Products (Custom)" || !savedDefinition.industry ? "📦" :
                   savedDefinition.industry.includes("Fashion") ? "👕" :
                   savedDefinition.industry.includes("Lifestyle") ? "🧴" :
                   savedDefinition.industry.includes("Home") ? "🏠" :
                   savedDefinition.industry.includes("Electronics") ? "🎧" : "🛠️"}
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Template</span>
                  <h2 className="text-base font-bold dark:text-white">
                    {savedDefinition.industry || "General Products (Custom)"}
                  </h2>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedTemplateCard ? 180 : 0 }}
                className="text-gray-400 shrink-0"
              >
                <MdExpandMore size={20} />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedTemplateCard && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-50 dark:border-gray-800"
                >
                  <div className="pt-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Active Fields</span>
                    <div className="flex flex-wrap gap-2">
                      {savedDefinition.fields.filter(f => f.key.startsWith('field') && f.enabled).map(field => (
                        <span key={field.key} className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
                          <MdCheckCircle size={14} className="text-blue-600 dark:text-blue-400" />
                          {field.label || "Untitled"}
                        </span>
                      ))}
                      {savedDefinition.fields.filter(f => f.key.startsWith('field') && f.enabled).length === 0 && (
                        <span className="text-xs text-gray-500 italic">No active fields</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Modern Tabs */}
        <div className="px-4 mt-4 shrink-0 -mx-4">
          <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl flex gap-1">
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "templates"
                  ? "bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <FiBriefcase size={14} />
              TEMPLATES
            </button>
            <button
              onClick={() => setActiveTab("fields")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "fields"
                  ? "bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <FiSettings size={14} />
              CONFIGURATION
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "templates" ? (
            <motion.div
              key="templates-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <FiBriefcase className="text-blue-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Industry Templates</h2>
              </div>
              
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Choose a template to quickly set up relevant fields for your business. Selecting a template will overwrite current labels.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateIndustry("General Products (Custom)")}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                    definition.industry === "General Products (Custom)" || !definition.industry
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">📦</div>
                    <div className="text-left">
                      <span className="font-bold text-sm block">Custom / General</span>
                      <span className="text-[10px] opacity-70">Flexible fields for any business</span>
                    </div>
                  </div>
                  {(definition.industry === "General Products (Custom)" || !definition.industry) && <FiCheck className="text-white" size={20} />}
                </button>
                
                {INDUSTRY_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateIndustry(preset.name)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      definition.industry === preset.name
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-900"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {preset.name.includes("Fashion") ? "👕" : 
                         preset.name.includes("Lifestyle") ? "🧴" : 
                         preset.name.includes("Home") ? "🏠" : 
                         preset.name.includes("Electronics") ? "🎧" : "🛠️"}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-sm block">{preset.name}</span>
                        <span className="text-[10px] opacity-70">{preset.fields.length} Recommended Fields</span>
                      </div>
                    </div>
                    {definition.industry === preset.name && <FiCheck className="text-white" size={20} />}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="fields-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-6 space-y-6"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
                <MdInfoOutline className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  Configure field labels and units. Tap a field to expand and edit details. Use drag handles to reorder.
                </p>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      <AnimatePresence mode="popLayout">
                        {allFields.map((field, index) => (
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
                                  <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedKey(expandedKey === field.key ? null : field.key)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div
                                          {...provided.dragHandleProps}
                                          onClick={(e) => e.stopPropagation()}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
                                            field.enabled ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                          }`}
                                        >
                                          <MdDragIndicator size={20} />
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {field.key.startsWith('field') ? `Slot ${field.key.replace('field', '')}` : `Price`}
                                          </span>
                                          <h3 className="font-bold text-sm dark:text-white truncate max-w-[150px]">
                                            {field.label || "Untitled Field"}
                                          </h3>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFieldEnabled(field.key);
                                          }}
                                          className={`w-10 h-5 rounded-full p-1 transition-all ${
                                            field.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                                          }`}
                                        >
                                          <motion.div
                                            animate={{ x: field.enabled ? 20 : 0 }}
                                            className="w-3 h-3 bg-white rounded-full shadow-sm"
                                          />
                                        </button>
                                        <motion.div
                                          animate={{ rotate: expandedKey === field.key ? 180 : 0 }}
                                          className="text-gray-400"
                                        >
                                          <MdExpandMore size={20} />
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {expandedKey === field.key && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                                      >
                                        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-4">
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
                                                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl text-sm outline-none transition-all dark:text-white"
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
                                                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl text-sm outline-none transition-all dark:text-white pr-10"
                                                    />
                                                    {field.unitOptions && field.unitOptions.length > 0 && (
                                                      <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="py-2 flex items-center gap-2 text-gray-400 italic text-xs justify-center">
                                              <span>Field is disabled. Enable to edit labels.</span>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </Draggable>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </motion.div>
          )}
        </AnimatePresence>
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
