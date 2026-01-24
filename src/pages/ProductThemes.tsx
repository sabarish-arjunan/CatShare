import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdAdd, MdDelete } from "react-icons/md";
import { MdCircle } from "react-icons/md";

interface CustomField {
  id: string;
  name: string;
  units: string[];
  defaultUnit: string;
  showUnits?: boolean;
}

interface ProductTheme {
  showSubtitle: boolean;
  showWholesalePrice: boolean;
  showResellPrice: boolean;
  customFields: CustomField[];
}

const DEFAULT_FIELDS: CustomField[] = [
  {
    id: "colour",
    name: "Colour",
    units: ["N/A"],
    defaultUnit: "N/A",
    showUnits: false,
  },
  {
    id: "package",
    name: "Package",
    units: ["pcs / set", "pcs / dozen", "pcs / pack"],
    defaultUnit: "pcs / set",
    showUnits: true,
  },
  {
    id: "agegroup",
    name: "Age Group",
    units: ["months", "years", "Newborn"],
    defaultUnit: "months",
    showUnits: true,
  },
];

export default function ProductThemes() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ProductTheme>(() => {
    const stored = localStorage.getItem("productTheme");
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      showSubtitle: true,
      showWholesalePrice: true,
      showResellPrice: true,
      customFields: DEFAULT_FIELDS,
    };
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldUnits, setEditFieldUnits] = useState("");
  const [editShowUnits, setEditShowUnits] = useState(true);

  useEffect(() => {
    localStorage.setItem("productTheme", JSON.stringify(theme));
    window.dispatchEvent(new CustomEvent("themeUpdated", { detail: theme }));
  }, [theme]);

  const handleToggle = (
    key: "showSubtitle" | "showWholesalePrice" | "showResellPrice"
  ) => {
    setTheme((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const startEditingField = (field: CustomField) => {
    setEditingField(field.id);
    setEditFieldName(field.name);
    setEditFieldUnits(field.units.join(", "));
    setEditShowUnits(field.showUnits ?? true);
  };

  const saveFieldEdit = () => {
    if (!editingField || !editFieldName.trim()) {
      setEditingField(null);
      return;
    }

    const units = editShowUnits
      ? editFieldUnits
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u.length > 0)
      : ["N/A"];

    setTheme((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === editingField
          ? {
              ...f,
              name: editFieldName.trim(),
              units: units.length > 0 ? units : ["N/A"],
              defaultUnit: units[0] || "N/A",
              showUnits: editShowUnits,
            }
          : f
      ),
    }));
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    setTheme((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.id !== fieldId),
    }));
  };

  const addNewField = () => {
    const newId = `field-${Date.now()}`;
    const newField: CustomField = {
      id: newId,
      name: `Field ${theme.customFields.length + 1}`,
      units: ["N/A"],
      defaultUnit: "N/A",
      showUnits: false,
    };
    setTheme((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-md transition"
          aria-label="Back"
          title="Back to Catalogue"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">Themes</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4 max-w-2xl">
          <p className="text-gray-600 text-sm">
            Customize which fields appear when creating products. Show/hide built-in fields and create custom fields with your own units.
          </p>

          {/* Built-in Fields Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Built-in Fields
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Toggle visibility of standard product fields
            </p>

            <div className="space-y-3">
              {/* Subtitle Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-800">
                    Subtitle
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Show/hide subtitle field in product creation
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showSubtitle")}
                  className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ml-4 shrink-0 ${
                    theme.showSubtitle ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      theme.showSubtitle ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Wholesale Price Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-800">
                    Wholesale Price
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Show/hide wholesale price field in product creation
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showWholesalePrice")}
                  className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ml-4 shrink-0 ${
                    theme.showWholesalePrice ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      theme.showWholesalePrice ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Resell Price Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-800">
                    Resell Price
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Show/hide resell price field in product creation
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("showResellPrice")}
                  className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ml-4 shrink-0 ${
                    theme.showResellPrice ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      theme.showResellPrice ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Custom Fields
              </h2>
              <button
                onClick={addNewField}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <MdAdd size={16} />
                Add Field
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Customize field names and their units. You can rename default fields or create new ones.
            </p>

            <div className="space-y-3">
              {theme.customFields.map((field) => (
                <div
                  key={field.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {editingField === field.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={editFieldName}
                          onChange={(e) => setEditFieldName(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="Field name (e.g., Colour, Material)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Units (comma-separated)
                        </label>
                        <textarea
                          value={editFieldUnits}
                          onChange={(e) => setEditFieldUnits(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                          placeholder="e.g., N/A or pcs/set, pcs/dozen, pcs/pack"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveFieldEdit}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800">
                          {field.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {field.units.map((unit, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {unit}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1.5 ml-3 shrink-0">
                        <button
                          onClick={() => startEditingField(field)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition font-medium"
                        >
                          Edit
                        </button>
                        {theme.customFields.length > 1 && (
                          <button
                            onClick={() => deleteField(field.id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                            title="Delete field"
                          >
                            <MdDelete size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">💡 How it works:</span>
            </p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4">
              <li>• Toggle built-in fields on/off</li>
              <li>• Rename custom fields and set their units</li>
              <li>• Changes apply immediately when creating products</li>
              <li>• Fields marked as "Not changeable" cannot be hidden</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
