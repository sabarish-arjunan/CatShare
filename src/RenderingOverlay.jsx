import React, { useEffect } from "react";
import { KeepAwake } from "@capacitor-community/keep-awake";

export default function RenderingOverlay({ visible, current, total }) {
  // Keep screen awake while rendering
  useEffect(() => {
    const toggleAwake = async () => {
      try {
        if (visible) {
          await KeepAwake.keepAwake();
        } else {
          await KeepAwake.allowSleep();
        }
      } catch (err) {
        console.warn("KeepAwake failed:", err);
      }
    };
    toggleAwake();
    return () => {
      KeepAwake.allowSleep().catch(() => {});
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 text-center">
      <div className="w-64 h-64">
        <video
          src="/sim-render.mp4"
          className="w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <div className="w-64 h-3 mt-4 bg-[#e3caa3] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6c3b2a] transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-[#4b2b22] font-medium">
        Rendering image {current} of {total}...
      </p>

      <p className="text-xs text-red-500 mt-2">
        ⚠️ Please keep the app open until rendering completes.
      </p>
    </div>
  );
}
