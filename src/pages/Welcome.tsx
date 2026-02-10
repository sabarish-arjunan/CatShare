import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { DEFAULT_FIELDS, FieldConfig } from '../config/fieldConfig';
import { safeSetInStorage, safeGetFromStorage } from '../utils/safeStorage';

type WelcomeStep = 'welcome' | 'industry' | 'fields' | 'restore' | 'complete';

interface SelectedFields {
  [key: string]: boolean;
}

const industryIcons: { [key: string]: string } = {
  'Fashion & Apparel': '👗',
  'Lifestyle & Personal Care': '🧴',
  'Home, Kitchen & Living': '🏠',
  'Electronics & Accessories': '📱',
  'Hardware, Tools & Industrial': '🔧',
};

const FloatingShapes = () => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-200 to-slate-200 rounded-full opacity-5 blur-3xl"
    />
    <motion.div
      animate={{
        x: [0, -100, 0],
        y: [0, -50, 0],
        rotate: [360, 180, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full opacity-5 blur-3xl"
    />
  </div>
);

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WelcomeStep>('welcome');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});
  const [hasBackup, setHasBackup] = useState(false);
  const [restoreData, setRestoreData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Note: App.tsx handles redirecting first-time users to /welcome automatically.
  // This component allows both first-time and returning users to access the welcome flow.

  useEffect(() => {
    const backup = safeGetFromStorage('productsBackup', null);
    setHasBackup(backup !== null);
  }, []);

  const handleIndustrySelect = (industryName: string) => {
    setSelectedIndustry(industryName);
    const industryPreset = INDUSTRY_PRESETS.find(p => p.name === industryName);
    const newSelectedFields: SelectedFields = {};
    
    if (industryPreset) {
      industryPreset.fields.forEach((field, index) => {
        newSelectedFields[`field${index + 1}`] = index < 3;
      });
    }
    
    setSelectedFields(newSelectedFields);
    setStep('fields');
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const industryPreset = INDUSTRY_PRESETS.find(p => p.name === selectedIndustry);
      
      if (!industryPreset) {
        throw new Error('Industry not found');
      }

      const configuredFields = DEFAULT_FIELDS.map((field, index) => {
        const fieldNum = index + 1;
        const isSelected = selectedFields[`field${fieldNum}`];
        const presetField = industryPreset.fields[index];
        
        return {
          ...field,
          enabled: isSelected,
          label: presetField?.label || field.label,
          ...(presetField?.defaultUnits && { unitOptions: presetField.defaultUnits })
        };
      });

      safeSetInStorage('fieldConfiguration', {
        version: 1,
        fields: configuredFields,
        industry: selectedIndustry,
        lastUpdated: Date.now(),
      });

      safeSetInStorage('selectedIndustry', selectedIndustry);

      if (restoreData && hasBackup) {
        const backup = safeGetFromStorage('productsBackup', []);
        safeSetInStorage('products', backup);
      }

      safeSetInStorage('hasCompletedOnboarding', true);

      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStep('complete');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error setting up. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingShapes />
      
      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg relative z-10"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-slate-200">
              {/* Animated background gradient */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="mb-8 relative z-10"
              >
                <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex items-center justify-center mx-auto mb-6"
              >
                  <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 p-2">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800"
                      alt="CatShare Logo"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10"
              >
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
                  Welcome to CatShare
                </h1>
                <p className="text-lg text-slate-600 mb-3 font-medium">
                  Your Ultimate Product Catalog Solution
                </p>
                <p className="text-slate-500 mb-10 text-base">
                  Create stunning product catalogs, organize inventory, and share effortlessly
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 relative z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('industry')}
                  className="w-full bg-gradient-to-r from-purple-500 via-blue-400 to-blue-500 text-white font-semibold py-4 px-8 rounded-xl hover:shadow-2xl transition-all duration-300 text-lg"
                >
                  Get Started
                </motion.button>
                <p className="text-xs text-slate-500">Takes just 2 minutes ⚡</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Industry Selection Step */}
        {step === 'industry' && (
          <motion.div
            key="industry"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl relative z-10"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-slate-200">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300 mb-3">
                  Choose Your Industry
                </h2>
                <p className="text-slate-300 text-base">
                  We'll customize fields based on your business type
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {INDUSTRY_PRESETS.map((industry, idx) => (
                  <motion.div
                    key={industry.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleIndustrySelect(industry.name)}
                    className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 group ${
                      selectedIndustry === industry.name
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-blue-500/20'
                        : 'border-slate-600 bg-slate-800/50 hover:border-purple-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{industryIcons[industry.name] || '💼'}</div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-200">{industry.name}</p>
                        <p className="text-sm text-slate-400 mt-1">{industry.fields.length} fields pre-configured</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                        selectedIndustry === industry.name
                          ? 'border-blue-400 bg-blue-500'
                          : 'border-slate-500 group-hover:border-purple-400'
                      }`} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('welcome')}
                  className="flex-1 border-2 border-slate-600 text-slate-300 font-bold py-3 rounded-xl hover:border-slate-500 hover:bg-slate-700/50 transition-all"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('fields')}
                  disabled={!selectedIndustry}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  Next
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Fields Selection Step */}
        {step === 'fields' && (
          <motion.div
            key="fields"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl relative z-10"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-slate-200">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300 mb-3">
                  Configure Fields
                </h2>
                <p className="text-slate-300 text-base">
                  Select which fields best describe your products
                </p>
              </motion.div>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-300">
                  💡 <strong>Tip:</strong> You can customize these anytime in Settings
                </p>
              </div>

              <div className="space-y-3 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {INDUSTRY_PRESETS.find(p => p.name === selectedIndustry)?.fields.map((field, idx) => {
                  const fieldKey = `field${idx + 1}`;
                  const isChecked = selectedFields[fieldKey] || false;
                  return (
                    <motion.div
                      key={fieldKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center p-4 border border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500 transition-all cursor-pointer group"
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-gradient-to-br from-purple-500 to-blue-400 border-blue-400'
                          : 'border-slate-500 group-hover:border-slate-400'
                      }`}>
                        {isChecked && <span className="text-white text-sm">✓</span>}
                      </div>
                      <label htmlFor={fieldKey} className="ml-4 flex-1 cursor-pointer">
                        <p className="font-semibold text-slate-200">{field.label}</p>
                        {field.defaultUnits && (
                          <p className="text-xs text-slate-400 mt-1">
                            {field.defaultUnits.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </label>
                      <input
                        type="checkbox"
                        id={fieldKey}
                        checked={isChecked}
                        onChange={() => handleFieldToggle(fieldKey)}
                        className="hidden"
                      />
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('industry')}
                  className="flex-1 border-2 border-slate-600 text-slate-300 font-bold py-3 rounded-xl hover:border-slate-500 hover:bg-slate-700/50 transition-all"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('restore')}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  Next
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Restore Data Step */}
        {step === 'restore' && (
          <motion.div
            key="restore"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg relative z-10"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-slate-200">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300 mb-3">
                  {hasBackup ? 'Restore Your Data?' : 'Ready to Begin!'}
                </h2>
                <p className="text-slate-300 text-base">
                  {hasBackup
                    ? 'We found your previous products. Would you like to import them?'
                    : 'Start fresh with your new configuration'}
                </p>
              </motion.div>

              {hasBackup && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-300">
                    ⚠️ <strong>Note:</strong> Restoring will import {safeGetFromStorage('productsBackup', []).length} products
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {hasBackup && (
                  <>
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-4 border-2 border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500 cursor-pointer transition-all"
                    >
                      <input
                        type="radio"
                        checked={restoreData}
                        onChange={() => setRestoreData(true)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      <span className="ml-4 text-slate-200 font-medium">Restore my products</span>
                    </motion.label>
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-4 border-2 border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500 cursor-pointer transition-all"
                    >
                      <input
                        type="radio"
                        checked={!restoreData}
                        onChange={() => setRestoreData(false)}
                        className="w-5 h-5 accent-blue-500"
                      />
                      <span className="ml-4 text-slate-200 font-medium">Start with a fresh catalog</span>
                    </motion.label>
                  </>
                )}
                {!hasBackup && (
                  <div className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400">No previous data found. You're all set to create your first catalog!</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('fields')}
                  className="flex-1 border-2 border-slate-600 text-slate-300 font-bold py-3 rounded-xl hover:border-slate-500 hover:bg-slate-700/50 transition-all"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  {isLoading ? '⏳ Setting up...' : '✨ Complete Setup'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-full max-w-lg relative z-10 text-center"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-slate-200">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="mb-8"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 2 }}
                  className="flex items-center justify-center mx-auto"
                >
                  <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 p-2">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800"
                      alt="CatShare Logo"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-purple-400 mb-4">
                  All Set! 🎉
                </h2>
                <p className="text-slate-300 text-lg mb-2">
                  Your {selectedIndustry} catalog is ready to go
                </p>
                <p className="text-slate-400 text-base">
                  Redirecting to your workspace...
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
}
