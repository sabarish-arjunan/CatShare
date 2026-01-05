import React, { useContext, useEffect, useState } from "react";
import { TutorialContext } from "./TutorialContext";

export default function TutorialOverlay() {
  const { isTutorialActive, currentStep } = useContext(TutorialContext);
  const [spotlightRect, setSpotlightRect] = useState(null);

  useEffect(() => {
    if (!isTutorialActive || !currentStep || !currentStep.target) {
      setSpotlightRect(null);
      return;
    }

    const updateSpotlight = () => {
      const targetElement = document.querySelector(`[data-tutorial="${currentStep.target}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: "12px",
        });
      }
    };

    updateSpotlight();
    const timer = setTimeout(updateSpotlight, 100);
    window.addEventListener("scroll", updateSpotlight);
    window.addEventListener("resize", updateSpotlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updateSpotlight);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, [isTutorialActive, currentStep]);

  if (!isTutorialActive) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 z-[250] bg-black/50 pointer-events-none" />

      {/* Spotlight/cutout */}
      {spotlightRect && (
        <div
          className="fixed z-[251] border-2 border-blue-400 pointer-events-none"
          style={{
            ...spotlightRect,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            backgroundColor: "transparent",
            animation: "pulse 2s infinite",
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </>
  );
}
