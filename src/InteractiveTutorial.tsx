import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi';
import { RiShoppingBag3Line, RiImageAddLine, RiShareForwardLine, RiCheckDoubleLine } from 'react-icons/ri';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string;
  action?: string;
  highlightClass?: string;
}

interface InteractiveTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export default function InteractiveTutorial({
  isVisible,
  onComplete,
  onSkip,
  currentStep = 0,
  onStepChange,
}: InteractiveTutorialProps) {
  const [step, setStep] = useState(currentStep);
  const [overlayPosition, setOverlayPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to CatShare!',
      description: 'Let\'s create your first product together. This quick guide will show you how to create, render, and share your products.',
      icon: <RiShoppingBag3Line className="w-8 h-8" />,
    },
    {
      id: 'create',
      title: 'Create Your First Product',
      description: 'Click the "Create Your First Product" button to start. You\'ll enter the product creation form where you can add details like name, pricing, images, and more.',
      icon: <RiShoppingBag3Line className="w-8 h-8" />,
      targetElement: 'create-first-product-btn',
      action: 'Click this button',
    },
    {
      id: 'add-details',
      title: 'Add Product Details',
      description: 'Fill in your product information including name, subtitle, pricing, category, and upload an image. All fields help customers understand your product better.',
      icon: <RiImageAddLine className="w-8 h-8" />,
    },
    {
      id: 'save-product',
      title: 'Save Your Product',
      description: 'After filling in the details, click "Save Product" to add it to your catalog. Your product will appear in the main product list.',
      icon: <RiCheckDoubleLine className="w-8 h-8" />,
    },
    {
      id: 'render-product',
      title: 'Render Product Images',
      description: 'Once your product is saved, you can render professional product images with your custom pricing, colors, and branding. Renders are generated automatically for all catalogues.',
      icon: <RiImageAddLine className="w-8 h-8" />,
    },
    {
      id: 'share-product',
      title: 'Share Your Product',
      description: 'Share the rendered product images with customers, retailers, and wholesalers. You can share via email, messaging, or download the images directly.',
      icon: <RiShareForwardLine className="w-8 h-8" />,
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Congratulations! You now know the basic workflow. You can create multiple products, manage different catalogues with custom pricing, and render & share professional images. Explore the app to learn more!',
      icon: <RiCheckDoubleLine className="w-8 h-8" />,
    },
  ];

  const currentStepData = steps[step];

  // Update position when step changes or target element changes
  useEffect(() => {
    if (currentStepData.targetElement) {
      const element = document.getElementById(currentStepData.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setOverlayPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    } else {
      setOverlayPosition(null);
    }
  }, [step, currentStepData.targetElement]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      onStepChange?.(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
      onStepChange?.(step - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/40 pointer-events-auto transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Highlight spotlight */}
      {overlayPosition && (
        <div
          className="fixed border-4 border-yellow-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-auto transition-all duration-300"
          style={{
            top: overlayPosition.top - 8,
            left: overlayPosition.left - 8,
            width: overlayPosition.width + 16,
            height: overlayPosition.height + 16,
          }}
        />
      )}

      {/* Tutorial card */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-11/12 p-6 relative animate-slideUp">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Skip tutorial"
          >
            <FiX size={24} />
          </button>

          {/* Step counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Step {step + 1} of {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    index <= step ? 'bg-blue-600 w-3' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4 text-blue-600">
            {currentStepData.icon}
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-gray-800 text-center mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {currentStepData.action && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs">
                  →
                </div>
              </div>
              <p className="text-sm text-blue-800 font-medium">{currentStepData.action}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={step === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              <FiChevronLeft size={18} />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {step === steps.length - 1 ? 'Complete' : 'Next'}
              {step < steps.length - 1 && <FiChevronRight size={18} />}
            </button>
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Skip Tutorial
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
