import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdCheck, MdAdd, MdClose } from "react-icons/md";
import { useToast } from "../context/ToastContext";
import { getAllCurrencies } from "../utils/currencyUtils";

export default function CurrencySettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const stored = localStorage.getItem("defaultCurrency");
    return stored || "INR";
  });
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customCurrencies, setCustomCurrencies] = useState(() => {
    const stored = localStorage.getItem("customCurrencies");
    return stored ? JSON.parse(stored) : {};
  });
  const [currencyUnits, setCurrencyUnits] = useState(() => {
    const stored = localStorage.getItem("currencyUnits");
    return stored ? JSON.parse(stored) : {};
  });
  const [editingUnits, setEditingUnits] = useState(false);
  const [unitsInput, setUnitsInput] = useState("");

  useEffect(() => {
    // Initialize default currency to INR if not already set
    const stored = localStorage.getItem("defaultCurrency");
    if (!stored) {
      localStorage.setItem("defaultCurrency", "INR");
      window.dispatchEvent(new CustomEvent("currencyChanged", { detail: { currency: "INR" } }));
    }

    // Load units for current currency
    const units = currencyUnits[selectedCurrency] || [];
    setUnitsInput(units.join(", "));
  }, [selectedCurrency, currencyUnits]);

  const handleCurrencySelect = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem("defaultCurrency", currencyCode);
    window.dispatchEvent(new CustomEvent("currencyChanged", { detail: { currency: currencyCode } }));
    showToast(`Currency changed to ${currencyCode}`, "success");

    // Load units for this currency
    const units = currencyUnits[currencyCode] || [];
    setUnitsInput(units.join(", "));
    setEditingUnits(false);
  };

  const handleSaveUnits = () => {
    const units = unitsInput
      .split(",")
      .map(u => u.trim())
      .filter(u => u !== "");

    if (units.length === 0) {
      showToast("Please enter at least one unit", "error");
      return;
    }

    const updated = { ...currencyUnits, [selectedCurrency]: units };
    setCurrencyUnits(updated);
    localStorage.setItem("currencyUnits", JSON.stringify(updated));
    setEditingUnits(false);
    showToast("Units saved successfully", "success");
  };

  const handleAddCustomCurrency = () => {
    if (!customCode.trim() || !customSymbol.trim()) {
      showToast("Please enter both currency code and symbol", "error");
      return;
    }

    if (customCode.length > 5) {
      showToast("Currency code should be 5 characters or less", "error");
      return;
    }

    const code = customCode.toUpperCase().trim();
    const symbol = customSymbol.trim();

    // Check if already exists
    if (getAllCurrencies().find(c => c.code === code) || customCurrencies[code]) {
      showToast(`Currency ${code} already exists`, "error");
      return;
    }

    // Add custom currency
    const updated = { ...customCurrencies, [code]: symbol };
    setCustomCurrencies(updated);
    localStorage.setItem("customCurrencies", JSON.stringify(updated));

    // Select it immediately
    handleCurrencySelect(code);

    // Reset form
    setCustomCode("");
    setCustomSymbol("");
    setShowCustomModal(false);
    showToast(`Custom currency ${code} added successfully`, "success");
  };

  const getAllCurrenciesList = () => {
    const standard = getAllCurrencies();
    const custom = Object.entries(customCurrencies).map(([code, symbol]) => ({
      code,
      symbol,
      name: `Custom - ${code}`,
      isCustom: true,
    }));
    return [...standard, ...custom];
  };

  const selectedCurrencyObj = getAllCurrenciesList().find(c => c.code === selectedCurrency);

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-950 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center dark:text-white">Currency</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Select your default currency for product pricing
          </p>

          {/* Current Selection Card */}
          {selectedCurrencyObj && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-2">Selected Currency</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedCurrencyObj.symbol}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{selectedCurrencyObj.code} - {selectedCurrencyObj.name}</p>
                </div>
                <MdCheck size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          )}

          {/* Currency Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Select Currency</h3>
            <div className="grid grid-cols-2 gap-3">
              {getAllCurrenciesList().map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCurrency === currency.code
                      ? "bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white shadow-lg"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-base">{currency.code}</p>
                      <p className={`text-xs ${selectedCurrency === currency.code ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                        {currency.symbol}
                      </p>
                      {currency.isCustom && (
                        <p className={`text-xs font-semibold mt-1 ${selectedCurrency === currency.code ? "text-blue-200" : "text-amber-600 dark:text-amber-400"}`}>
                          Custom
                        </p>
                      )}
                    </div>
                    {selectedCurrency === currency.code && (
                      <MdCheck size={20} className="text-white flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}

              {/* Add Custom Currency Button */}
              <button
                onClick={() => setShowCustomModal(true)}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-left"
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MdAdd size={28} className="mx-auto mb-2" />
                    <p className="font-semibold text-sm">Add Custom</p>
                    <p className="text-xs opacity-70">Create your own</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Price Field Units */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Price Units</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set available units for {selectedCurrencyObj?.code}</p>
            </div>

            <div className="p-4">
              {!editingUnits ? (
                <div className="space-y-3">
                  {(currencyUnits[selectedCurrency] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(currencyUnits[selectedCurrency] || []).map((unit, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
                          {unit}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No units configured. Click Edit to add units.</p>
                  )}

                  <button
                    onClick={() => {
                      setEditingUnits(true);
                      setUnitsInput((currencyUnits[selectedCurrency] || []).join(", "));
                    }}
                    className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
                  >
                    Edit Units
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Enter units (comma-separated)
                    </label>
                    <textarea
                      value={unitsInput}
                      onChange={(e) => setUnitsInput(e.target.value)}
                      placeholder="e.g. / piece, / dozen, / set, / kg"
                      rows="3"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter each unit on a new line or separated by commas
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUnits(false);
                        setUnitsInput("");
                      }}
                      className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-sm transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUnits}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
                    >
                      Save Units
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">About</h3>
            <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1">
              <li>• Your default currency is saved automatically</li>
              <li>• You can change it anytime</li>
              <li>• This setting applies to all your products</li>
              <li>• Individual products can still use different currencies</li>
              <li>• Create custom currencies for unsupported or local currencies</li>
              <li>• Set default units for pricing (piece, dozen, kg, etc.)</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Custom Currency Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold dark:text-white">Add Custom Currency</h2>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomCode("");
                  setCustomSymbol("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <MdClose size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Currency Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., XYZ"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  maxLength="5"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3-5 uppercase letters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g., $, €, ₹, etc."
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  maxLength="10"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Any symbol or text</p>
              </div>

              {/* Preview */}
              {customCode && customSymbol && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{customSymbol}</div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{customCode}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Custom Currency</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomCode("");
                  setCustomSymbol("");
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold text-sm transition dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomCurrency}
                disabled={!customCode.trim() || !customSymbol.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-semibold text-sm text-white transition"
              >
                Add Currency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
