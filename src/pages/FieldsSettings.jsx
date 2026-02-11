import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdRefresh, MdDragIndicator, MdAdd, MdCheckCircle, MdInfoOutline, MdExpandMore, MdEdit, MdCheck, MdVisibility, MdVisibilityOff, MdToggleOn, MdToggleOff } from "react-icons/md";
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
  const [editingLabelKey, setEditingLabelKey] = useState(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let def = getFieldsDefinition();

    // Cleanup: Remove old disabled fields beyond field10
    const customFields = def.fields.filter(f => f.key.startsWith('field'));
    const hasOldFields = customFields.some(f => parseInt(f.key.replace('field', '')) > 10 && !f.enabled);

    if (hasOldFields) {
      def = {
        ...def,
        fields: def.fields.filter(f => {
          if (f.key.startsWith('field') && parseInt(f.key.replace('field', '')) > 10 && !f.enabled) {
            return false;
          }
          return true;
        })
      };
      setFieldsDefinition(def);
    }

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
    const currentList = [...productFields];

    const sourceField = currentList[result.source.index];
    const destField = currentList[result.destination.index];

    const sourceIndex = items.findIndex(f => f.key === sourceField.key);
    const destIndex = items.findIndex(f => f.key === destField.key);

    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);

    setDefinition({ ...definition, fields: items });
  };

  const getUnitPlaceholder = (label) => {
    const labelLower = label?.toLowerCase() || '';

    // Fashion & Apparel examples
    if (labelLower.includes('size')) return "e.g. S, M, L, XL";
    if (labelLower.includes('fabric')) return "e.g. Cotton, Silk, Polyester";
    if (labelLower.includes('fit')) return "e.g. Slim, Regular, Loose";

    // Lifestyle & Personal Care examples
    if (labelLower.includes('volume') || labelLower.includes('weight')) return "e.g. ml, g, kg";
    if (labelLower.includes('skin') || labelLower.includes('hair')) return "e.g. Dry, Oily, Normal";

    // Home, Kitchen & Living examples
    if (labelLower.includes('material')) return "e.g. Steel, Plastic, Wood";
    if (labelLower.includes('dimension')) return "e.g. inches, cm, mm";
    if (labelLower.includes('capacity')) return "e.g. 500ml, 1L, 2L";

    // Electronics examples
    if (labelLower.includes('warranty')) return "e.g. months, years";
    if (labelLower.includes('connectivity')) return "e.g. WiFi, Bluetooth, USB";

    // Industrial examples
    if (labelLower.includes('specification')) return "e.g. High, Medium, Low";
    if (labelLower.includes('quality')) return "e.g. Premium, Standard, Economy";
    if (labelLower.includes('coating')) return "e.g. Powder, Galvanized, Painted";

    // Default
    return "e.g. option1, option2, option3";
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

  const toggleUnitsEnabled = async (key) => {
    if (!definition) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}

    const newFields = definition.fields.map(f =>
      f.key === key ? { ...f, unitsEnabled: !f.unitsEnabled } : f
    );
    setDefinition({ ...definition, fields: newFields });
  };

  const handleAddField = async () => {
    if (!definition) return;

    // First, try to find a disabled field from the pre-filled fields (1-10)
    const nextDisabledField = definition.fields.find(f => f.key.startsWith('field') && !f.enabled && parseInt(f.key.replace('field', '')) <= 10);

    if (nextDisabledField) {
      // Enable an existing disabled field
      const newFields = definition.fields.map(f =>
        f.key === nextDisabledField.key ? { ...f, enabled: true, label: "" } : f
      );
      setDefinition({ ...definition, fields: newFields });
      setExpandedKey(nextDisabledField.key);

      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}

      showToast(`Added new field`, "success");
    } else {
      // All 1-10 are enabled, so create a new field dynamically
      const customFields = definition.fields.filter(f => f.key.startsWith('field'));
      const maxFieldNum = customFields.length > 0
        ? Math.max(...customFields.map(f => parseInt(f.key.replace('field', ''))))
        : 0;
      const nextFieldNum = maxFieldNum + 1;

      const newField = {
        key: `field${nextFieldNum}`,
        label: "",
        type: 'text',
        enabled: true,
        unitsEnabled: false,
        unitOptions: [],
      };

      const newFields = [...definition.fields];
      newFields.splice(-1, 0, newField); // Insert before price1
      setDefinition({ ...definition, fields: newFields });
      setExpandedKey(newField.key);

      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}

      showToast(`Field ${nextFieldNum} added`, "success");
    }
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
              unitsEnabled: !!(presetField.defaultUnits || f.unitOptions?.length > 0),
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
          return { ...f, enabled: false };
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

  const startEditingLabel = (e, field) => {
    e.stopPropagation();
    setEditingLabelKey(field.key);
    setEditingLabelValue(field.label || "");
  };

  const saveEditingLabel = (e, key) => {
    e.stopPropagation();
    updateFieldLabel(key, editingLabelValue);
    setEditingLabelKey(null);
    setEditingLabelValue("");
  };

  if (!definition) return null;

  const productFields = definition.fields.filter(f => f.key.startsWith('field'));
  const allFields = [...productFields];
  const activeProductFieldsCount = productFields.filter(f => f.enabled).length;

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

      <main className="flex-1 overflow-y-auto px-4" ref={scrollContainerRef}>
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
                    {(savedDefinition.industry === "General Products (Custom)" || !savedDefinition.industry) ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-500 italic leading-relaxed">
                          Custom template enabled. You can manually add and configure fields to match your specific business needs.
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab("fields");
                            if (definition.fields.filter(f => f.key.startsWith('field') && f.enabled).length === 0) {
                              handleAddField();
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                        >
                          <MdAdd size={20} />
                          Add / Configure Fields
                        </button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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
                        {(() => {
                          const isCustomTemplate = definition.industry === "General Products (Custom)" || !definition.industry;
                          // For custom templates, only show enabled fields. For presets, show all fields that match the preset
                          const visibleFields = isCustomTemplate
                            ? allFields.filter(f => f.enabled)
                            : allFields.filter(f => f.key.startsWith('field'));
                          return visibleFields.map((field, index) => (
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
                                            {`Field ${field.key.replace('field', '')}`}
                                          </span>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <AnimatePresence mode="wait">
                                              {editingLabelKey === field.key ? (
                                                <motion.div
                                                  key="edit-mode"
                                                  className="flex items-center gap-1"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <div className="relative">
                                                    <input
                                                      autoFocus
                                                      type="text"
                                                      value={editingLabelValue}
                                                      onChange={(e) => setEditingLabelValue(e.target.value)}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditingLabel(e, field.key);
                                                        if (e.key === 'Escape') setEditingLabelKey(null);
                                                      }}
                                                      className="bg-transparent border-0 border-b-2 border-transparent px-0 py-0.5 text-sm font-medium w-32 outline-none focus:ring-0 relative z-10"
                                                    />
                                                    <motion.div
                                                      initial={{ scaleX: 0, originX: 0 }}
                                                      animate={{ scaleX: 1, originX: 0 }}
                                                      exit={{ scaleX: 0, originX: 1 }}
                                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                                                    />
                                                  </div>
                                                  <motion.button
                                                    onClick={(e) => saveEditingLabel(e, field.key)}
                                                    initial={{ opacity: 0, rotate: -90 }}
                                                    animate={{ opacity: 1, rotate: 0 }}
                                                    exit={{ opacity: 0, rotate: 90 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Save"
                                                  >
                                                    <MdCheck size={20} />
                                                  </motion.button>
                                                </motion.div>
                                              ) : (
                                                <motion.div
                                                  key="view-mode"
                                                  className="flex items-center gap-2"
                                                >
                                                  <h3 className="font-bold text-sm dark:text-white truncate max-w-[150px]">
                                                    {field.label || "Untitled Field"}
                                                  </h3>
                                                  <motion.button
                                                    onClick={(e) => startEditingLabel(e, field)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                  >
                                                    <MdEdit size={14} />
                                                  </motion.button>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFieldEnabled(field.key);
                                          }}
                                          whileHover={{ scale: 1.15 }}
                                          whileTap={{ scale: 0.9 }}
                                          className={`cursor-pointer transition-colors ${
                                            field.enabled
                                              ? "text-blue-600"
                                              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                          }`}
                                          title={field.enabled ? "Hide field" : "Show field"}
                                        >
                                          <motion.div
                                            initial={false}
                                            animate={{ scale: field.enabled ? 1 : 0.8 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            {field.enabled ? (
                                              <MdVisibility size={20} />
                                            ) : (
                                              <MdVisibilityOff size={20} />
                                            )}
                                          </motion.div>
                                        </motion.button>
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
                                              {field.key.startsWith('field') && (
                                                (() => {
                                                  const fieldNum = parseInt(field.key.replace('field', ''));
                                                  const isCustomTemplate = definition.industry === "General Products (Custom)" || !definition.industry;
                                                  const isDynamicallyAdded = fieldNum > 10;
                                                  const canRemove = isCustomTemplate || isDynamicallyAdded;

                                                  return canRemove ? (
                                                    <div className="flex items-center justify-end">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleFieldEnabled(field.key);
                                                        }}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase"
                                                      >
                                                        <FiTrash2 size={12} />
                                                        Remove Field
                                                      </button>
                                                    </div>
                                                  ) : null;
                                                })()
                                              )}

                                              {field.key.startsWith('field') && (
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                                      Units
                                                    </label>
                                                    <motion.button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleUnitsEnabled(field.key);
                                                      }}
                                                      whileHover={{ scale: 1.2 }}
                                                      whileTap={{ scale: 0.95 }}
                                                      className="cursor-pointer transition-colors"
                                                      title={field.unitsEnabled ? "Disable units" : "Enable units"}
                                                    >
                                                      {field.unitsEnabled ? (
                                                        <MdToggleOn size={28} className="text-blue-600" />
                                                      ) : (
                                                        <MdToggleOff size={28} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-400" />
                                                      )}
                                                    </motion.button>
                                                  </div>

                                                  <AnimatePresence>
                                                    {field.unitsEnabled && (
                                                      <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                      >
                                                        <div className="relative pt-2">
                                                          <input
                                                            type="text"
                                                            value={field.unitOptions?.join(", ") || ""}
                                                            onChange={(e) => updateFieldUnits(field.key, e.target.value)}
                                                            placeholder={getUnitPlaceholder(field.label)}
                                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm outline-none transition-all dark:text-white"
                                                          />
                                                        </div>
                                                      </motion.div>
                                                    )}
                                                  </AnimatePresence>
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
                            {/* Add New Field button after field 10 for industry templates */}
                            {!isCustomTemplate && field.key === "field10" && (
                              <motion.div
                                key="add-field-button"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                              >
                                <button
                                  onClick={handleAddField}
                                  className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98] mt-3"
                                >
                                  <MdAdd size={24} />
                                  <span className="font-bold text-sm">Add New Field</span>
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                        ));
                        })()}
                        {/* Add New Field button for custom templates - always visible */}
                        {(() => {
                          const isCustomTemplate = definition.industry === "General Products (Custom)" || !definition.industry;
                          return isCustomTemplate ? (
                            <motion.div
                              key="add-field-button-custom"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <button
                                onClick={handleAddField}
                                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98]"
                              >
                                <MdAdd size={24} />
                                <span className="font-bold text-sm">Add New Field</span>
                              </button>
                            </motion.div>
                          ) : null;
                        })()}
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
