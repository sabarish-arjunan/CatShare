import React, { useContext, useEffect, useRef, useState } from "react";
import { TutorialContext } from "./TutorialContext";

export default function TutorialHint() {
  const { isTutorialActive, currentStep, nextStep, prevStep, currentStepIndex, totalSteps, completeTutorial } = useContext(TutorialContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const hintRef = useRef(null);

  useEffect(() => {
    const handleSkipTutorial = () => {
      completeTutorial();
    };

    window.addEventListener("skip-tutorial", handleSkipTutorial);
    return () => window.removeEventListener("skip-tutorial", handleSkipTutorial);
  }, [completeTutorial]);

  useEffect(() => {
    if (!isTutorialActive || !currentStep || !currentStep.target) {
      setPosition({ top: 0, left: 0 });
      return;
    }

    const updatePosition = () => {
      const targetElement = document.querySelector(`[data-tutorial="${currentStep.target}"]`);
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const hintWidth = hintRef.current?.offsetWidth || 300;
      const hintHeight = hintRef.current?.offsetHeight || 220;

      let top = rect.bottom + 16;
      let left = rect.left + rect.width / 2 - hintWidth / 2;

      // Adjust if hint goes off-screen
      if (left < 16) left = 16;
      if (left + hintWidth > window.innerWidth - 16) {
        left = window.innerWidth - hintWidth - 16;
      }

      if (top + hintHeight > window.innerHeight - 100) {
        top = rect.top - hintHeight - 16;
      }

      setPosition({ top, left });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isTutorialActive, currentStep]);

  if (!isTutorialActive || !currentStep) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <>
      {/* Tutorial hint bubble */}
      <div
        ref={hintRef}
        className="fixed z-[300] bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-2 border-blue-400"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          animation: "slideUp 0.4s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={completeTutorial}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {currentStepIndex + 1}
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2">{currentStep.title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{currentStep.description}</p>

        {/* Action hint */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded mb-4">
          <p className="text-xs font-semibold text-blue-900">{currentStep.action}</p>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
              currentStepIndex === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Back
          </button>
          <button
            onClick={completeTutorial}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Exit
          </button>
          <button
            onClick={nextStep}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>

      {/* Arrow pointer */}
      {currentStep.target && (
        <div
          className="fixed w-0 h-0 z-[299] pointer-events-none"
          style={{
            top: `${position.top - 14}px`,
            left: `${position.left + (hintRef.current?.offsetWidth || 300) / 2}px`,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "14px solid rgb(191 219 254)", // blue-200
          }}
        />
      )}

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
      `}</style>
    </>
  );
}
