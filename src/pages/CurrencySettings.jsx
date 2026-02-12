import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdCheck } from "react-icons/md";
import { useToast } from "../context/ToastContext";

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

export default function CurrencySettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const stored = localStorage.getItem("defaultCurrency");
    return stored || "USD";
  });

  const handleCurrencySelect = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem("defaultCurrency", currencyCode);
    window.dispatchEvent(new CustomEvent("currencyChanged", { detail: { currency: currencyCode } }));
    showToast(`Currency changed to ${currencyCode}`, "success");
  };

  const selectedCurrencyObj = COMMON_CURRENCIES.find(c => c.code === selectedCurrency);

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
              {COMMON_CURRENCIES.map((currency) => (
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
                    </div>
                    {selectedCurrency === currency.code && (
                      <MdCheck size={20} className="text-white flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
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
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
