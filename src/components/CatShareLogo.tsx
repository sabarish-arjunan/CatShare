import React from "react";

export type CatShareLogoProps = {
  size?: number;
  title?: string;
  className?: string;
};

export default function CatShareLogo({ size = 24, title = "CatShare logo", className }: CatShareLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <filter id="catshare-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.12" />
        </filter>
      </defs>

      {/* White background */}
      <rect width="128" height="128" fill="#ffffff" />

      {/* Blue triangle top-left */}
      <path d="M 18 106 L 56 25 L 81 50 Z" fill="#0084D4" filter="url(#catshare-shadow)" />

      {/* Gray edge element */}
      <path d="M 56 25 L 81 50 L 62 69 Z" fill="#E8E8E8" filter="url(#catshare-shadow)" />

      {/* Dark outline for blue triangle */}
      <path
        d="M 18 106 L 56 25 L 81 50 Z"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Red triangle bottom-right */}
      <path d="M 62 69 L 87 50 L 106 106 Z" fill="#FF4444" filter="url(#catshare-shadow)" />

      {/* Dark outline for red triangle */}
      <path
        d="M 62 69 L 87 50 L 106 106 Z"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left vertical line element */}
      <path d="M 31 81 L 44 106" stroke="#2a2a2a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
