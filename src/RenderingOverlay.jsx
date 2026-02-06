import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const getPageBackgroundColor = () => {
  try {
    const candidates = [
      document.querySelector("main"),
      document.getElementById("root"),
      document.body,
      document.documentElement,
    ];
    for (const el of candidates) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      const bgColor = cs.backgroundColor;
      const isTransparent = !bgColor || bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent";
      const hasGradient = (cs.backgroundImage || "").includes("gradient");
      if (!isTransparent && !hasGradient) return bgColor;
    }
  } catch {}
  return "#ffffff";
};

const withAlpha = (color, alpha = 0.9) => {
  if (!color) return `rgba(255,255,255,${alpha})`;
  const rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const rgba = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d\.]+)\)$/);
  if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`;
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  if (color.startsWith("#")) {
    let r = 255, g = 255, b = 255;
    if (color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255,255,255,${alpha})`;
};

export default function RenderingOverlay({ visible, current, total }) {
  const [pageBg, setPageBg] = useState("#ffffff");

  // Compute page background color
  useEffect(() => {
    if (visible) {
      setPageBg(getPageBackgroundColor());
    }
  }, [visible]);

  if (!visible) return null;

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) {
    console.warn("Portal root not found, overlay may not display correctly");
    return null;
  }

  const percentage = Math.round((current / total) * 100);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center" style={{ backgroundColor: "#f3f4f6" }}>
      <div className="w-64 h-64">
        <video
          src="/sim-render.mp4"
          className="w-full h-full object-contain"
          style={{ backgroundColor: "#f3f4f6" }}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <div className="w-64 h-3 mt-4 bg-[#e3caa3] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6c3b2a] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-[#4b2b22] font-medium">
        Rendering image {current} of {total}... ({percentage}%)
      </p>

      <p className="mt-6 text-xs text-red-600 font-semibold">
        ⚠️ Do not close the app during rendering
      </p>
    </div>,
    portalRoot
  );
}
