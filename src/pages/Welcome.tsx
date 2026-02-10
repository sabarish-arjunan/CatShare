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

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WelcomeStep>('welcome');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});
  const [hasBackup, setHasBackup] = useState(false);
  const [restoreData, setRestoreData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if app has been initialized before
  useEffect(() => {
    const isFirstTime = !safeGetFromStorage('hasCompletedOnboarding', false);
    if (!isFirstTime) {
      navigate('/');
    }
  }, [navigate]);

  // Check for backup data
  useEffect(() => {
    const backup = safeGetFromStorage('productsBackup', null);
    setHasBackup(backup !== null);
  }, []);

  const handleIndustrySelect = (industryName: string) => {
    setSelectedIndustry(industryName);
    
    // Initialize selected fields based on industry preset
    const industryPreset = INDUSTRY_PRESETS.find(p => p.name === industryName);
    const newSelectedFields: SelectedFields = {};
    
    if (industryPreset) {
      industryPreset.fields.forEach((field, index) => {
        // By default, select first 3 fields
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
      // Find the selected industry preset
      const industryPreset = INDUSTRY_PRESETS.find(p => p.name === selectedIndustry);
      
      if (!industryPreset) {
        throw new Error('Industry not found');
      }

      // Create field configuration based on selections
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

      // Save field configuration
      safeSetInStorage('fieldConfiguration', {
        version: 1,
        fields: configuredFields,
        industry: selectedIndustry,
        lastUpdated: Date.now(),
      });

      // Save selected industry
      safeSetInStorage('selectedIndustry', selectedIndustry);

      // Handle restore if selected
      if (restoreData && hasBackup) {
        const backup = safeGetFromStorage('productsBackup', []);
        safeSetInStorage('products', backup);
      }

      // Mark onboarding as complete
      safeSetInStorage('hasCompletedOnboarding', true);

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStep('complete');
      
      // Navigate to home after completion animation
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error setting up. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📦</span>
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to CatShare</h1>
              <p className="text-gray-600 mb-2">Create, organize, and share product catalogs</p>
              <p className="text-gray-500 text-sm mb-8">Let's set up your workspace in just a few steps</p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('industry')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-shadow"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Industry Selection Step */}
        {step === 'industry' && (
          <motion.div
            key="industry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Industry</h2>
              <p className="text-gray-600 mb-6">Select the industry that best matches your business</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {INDUSTRY_PRESETS.map((industry, idx) => (
                  <motion.div
                    key={industry.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleIndustrySelect(industry.name)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedIndustry === industry.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedIndustry === industry.name}
                        onChange={() => {}}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{industry.name}</p>
                        <p className="text-xs text-gray-500">{industry.fields.length} fields</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('welcome')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('fields')}
                  disabled={!selectedIndustry}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Configure Your Fields</h2>
              <p className="text-gray-600 mb-6">Choose which fields you want for your products</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> You can add or modify these fields anytime in Settings
                </p>
              </div>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {INDUSTRY_PRESETS.find(p => p.name === selectedIndustry)?.fields.map((field, idx) => {
                  const fieldKey = `field${idx + 1}`;
                  return (
                    <motion.div
                      key={fieldKey}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={fieldKey}
                        checked={selectedFields[fieldKey] || false}
                        onChange={() => handleFieldToggle(fieldKey)}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor={fieldKey} className="ml-3 flex-1 cursor-pointer">
                        <p className="font-semibold text-gray-800">{field.label}</p>
                        {field.defaultUnits && (
                          <p className="text-xs text-gray-500">
                            Units: {field.defaultUnits.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </label>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('industry')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('restore')}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Restore Data?</h2>
              <p className="text-gray-600 mb-6">
                {hasBackup
                  ? 'We found a backup of your previous data. Would you like to restore it?'
                  : 'You can start fresh with your new configuration.'}
              </p>

              {hasBackup && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Restoring will import your previous products
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {hasBackup && (
                  <>
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={restoreData}
                        onChange={() => setRestoreData(true)}
                        className="w-5 h-5"
                      />
                      <span className="ml-3 font-semibold text-gray-800">Restore my data</span>
                    </label>
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={!restoreData}
                        onChange={() => setRestoreData(false)}
                        className="w-5 h-5"
                      />
                      <span className="ml-3 font-semibold text-gray-800">Start fresh</span>
                    </label>
                  </>
                )}
                {!hasBackup && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">No previous data found. Starting fresh...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('fields')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg disabled:opacity-50 transition-shadow"
                >
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">✓</span>
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">All Set!</h2>
              <p className="text-gray-600 mb-4">
                Your {selectedIndustry} catalog is ready
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your workspace...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
