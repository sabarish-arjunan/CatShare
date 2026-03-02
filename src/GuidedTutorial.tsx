import React, { useState, useEffect, useRef } from 'react';
import { FiChevronRight, FiX } from 'react-icons/fi';

export type GuidanceStep = 
  | 'click-plus-button'
  | 'fill-product-name'
  | 'add-product-image'
  | 'fill-product-details'
  | 'save-product'
  | 'render-product'
  | 'share-product'
  | 'complete';

interface GuideOverlay {
  targetElementId: string;
  title: string;
  description: string;
  nextStepHint?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTutorialProps {
  isActive: boolean;
  currentStep: GuidanceStep;
  onStepComplete: (nextStep: GuidanceStep) => void;
  onSkip: () => void;
}

const guideContent: Record<GuidanceStep, GuideOverlay> = {
  'click-plus-button': {
    targetElementId: 'create-product-plus-btn',
    title: 'Create Your First Product',
    description: 'Click the + button to start creating your first product',
    nextStepHint: 'Click the button to continue',
    position: 'top',
  },
  'fill-product-name': {
    targetElementId: 'product-name-input',
    title: 'Product Name',
    description: 'Enter your product name here. This is what customers will see.',
    nextStepHint: 'Type a name and move to the next field',
    position: 'top',
  },
  'add-product-image': {
    targetElementId: 'product-image-upload',
    title: 'Add Product Image',
    description: 'Click here to upload or select a product image from your gallery',
    nextStepHint: 'Click to select an image',
    position: 'top',
  },
  'fill-product-details': {
    targetElementId: 'product-details-section',
    title: 'Fill Product Details',
    description: 'Add more details like price, category, and subtitle. These help customers understand your product better.',
    nextStepHint: 'Fill in the details and continue',
    position: 'top',
  },
  'save-product': {
    targetElementId: 'save-product-btn',
    title: 'Save Your Product',
    description: 'Click the Save button to add this product to your catalog.',
    nextStepHint: 'Click to save',
    position: 'top',
  },
  'render-product': {
    targetElementId: 'product-render-btn',
    title: 'Render Product Image',
    description: 'Render creates professional product images with your pricing and branding.',
    nextStepHint: 'Click to render (or skip for now)',
    position: 'top',
  },
  'share-product': {
    targetElementId: 'product-share-btn',
    title: 'Share Your Product',
    description: 'Share your product image with customers, retailers, and wholesalers.',
    nextStepHint: 'Click to share (or you can do this later)',
    position: 'top',
  },
  'complete': {
    targetElementId: 'products-list-container',
    title: 'You\'re All Set!',
    description: 'Great! You\'ve created your first product. You can now create more products, manage catalogues, and render professional images.',
    position: 'center',
  },
};

export default function GuidedTutorial({
  isActive,
  currentStep,
  onStepComplete,
  onSkip,
}: GuidedTutorialProps) {
  const [elementPosition, setElementPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const guide = guideContent[currentStep];

  // Update element position whenever step changes or window resizes
  useEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById(guide.targetElementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updatePosition();

    // Recheck position on scroll and resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Also recheck periodically in case DOM changes
    const interval = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [guide.targetElementId]);

  if (!isActive || currentStep === 'complete') {
    return null;
  }

  // Calculate tooltip position relative to target element
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9998,
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '300px',
  };

  if (elementPosition) {
    const padding = 16;
    const { top, left, width, height } = elementPosition;

    switch (guide.position) {
      case 'top':
        tooltipStyle.left = left + width / 2 - 150; // Center horizontally
        tooltipStyle.top = top - 180;
        break;
      case 'bottom':
        tooltipStyle.left = left + width / 2 - 150;
        tooltipStyle.top = top + height + padding;
        break;
      case 'left':
        tooltipStyle.left = left - 320;
        tooltipStyle.top = top + height / 2 - 100;
        break;
      case 'right':
        tooltipStyle.left = left + width + padding;
        tooltipStyle.top = top + height / 2 - 100;
        break;
      case 'center':
      default:
        // Center on screen
        tooltipStyle.position = 'fixed';
        tooltipStyle.top = '50%';
        tooltipStyle.left = '50%';
        tooltipStyle.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      {elementPosition && (
        <div className="fixed inset-0 z-[9997] bg-black/30 pointer-events-none" />
      )}

      {/* Highlight spotlight around target element */}
      {elementPosition && (
        <div
          className="fixed border-4 border-blue-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] pointer-events-none transition-all duration-300"
          style={{
            top: elementPosition.top - 8,
            left: elementPosition.left - 8,
            width: elementPosition.width + 16,
            height: elementPosition.height + 16,
            zIndex: 9997,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="animate-slideUp border border-blue-200"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-sm">{guide.title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"
            title="Skip tutorial"
          >
            <FiX size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          {guide.description}
        </p>

        {guide.nextStepHint && (
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-3">
            <FiChevronRight size={14} />
            {guide.nextStepHint}
          </div>
        )}

        <button
          onClick={onSkip}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          Skip Tutorial
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
