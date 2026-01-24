import React from "react";

interface CustomField {
  id: string;
  name: string;
  units: string[];
  defaultUnit: string;
  showUnits?: boolean;
}

interface ProductTheme {
  showSubtitle: boolean;
  showWholesalePrice: boolean;
  showResellPrice: boolean;
  customFields: CustomField[];
}

interface ProductPreviewProps {
  theme: ProductTheme;
  sampleImage?: string;
  compact?: boolean;
}

// Sample product data for preview
const SAMPLE_PRODUCT = {
  name: "Sample Product",
  subtitle: "Premium Quality",
  wholesale: 150,
  resell: 299,
  wholesaleUnit: "per dozen",
  resellUnit: "per piece",
  badge: "NEW",
  imageBgColor: "white",
  fontColor: "black",
  bgColor: "#add8e6",
};

const getLighterColor = (color: string): string => {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const lighten = (c: number) => Math.min(255, c + 40);
    return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  }
  return color;
};

export default function ProductPreview({
  theme,
  sampleImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e0e0e0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3ESample Image%3C/text%3E%3C/svg%3E",
}: ProductPreviewProps) {
  const badgeBg = SAMPLE_PRODUCT.imageBgColor.toLowerCase() === "white" ? "#fff" : "#000";
  const badgeText = SAMPLE_PRODUCT.imageBgColor.toLowerCase() === "white" ? "#000" : "#fff";
  const badgeBorder =
    SAMPLE_PRODUCT.imageBgColor.toLowerCase() === "white"
      ? "rgba(0, 0, 0, 0.4)"
      : "rgba(255, 255, 255, 0.4)";

  return (
    <div
      className="mt-6 border rounded shadow overflow-hidden mx-auto"
      style={{ maxWidth: 330, width: "100%" }}
    >
      {/* Wholesale Price Bar */}
      {theme.showWholesalePrice && (
        <div
          style={{
            backgroundColor: SAMPLE_PRODUCT.bgColor,
            color: SAMPLE_PRODUCT.fontColor,
            padding: "8px",
            textAlign: "center",
            fontWeight: "normal",
            fontSize: 19,
          }}
        >
          Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{SAMPLE_PRODUCT.wholesale}{" "}
          {SAMPLE_PRODUCT.wholesaleUnit}
        </div>
      )}

      {/* Image Section */}
      <div
        style={{
          position: "relative",
          backgroundColor: SAMPLE_PRODUCT.imageBgColor,
          textAlign: "center",
          padding: 10,
          boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
        }}
      >
        <img
          src={sampleImage}
          alt="Sample"
          style={{
            maxWidth: "100%",
            maxHeight: 300,
            objectFit: "contain",
            margin: "0 auto",
          }}
        />

        {/* Badge */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: badgeBg,
            color: badgeText,
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: "999px",
            opacity: 0.95,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            border: `1px solid ${badgeBorder}`,
            letterSpacing: "0.5px",
          }}
        >
          {SAMPLE_PRODUCT.badge.toUpperCase()}
        </div>
      </div>

      {/* Details Section */}
      <div
        style={{
          backgroundColor: getLighterColor(SAMPLE_PRODUCT.bgColor),
          color: SAMPLE_PRODUCT.fontColor,
          padding: 10,
        }}
      >
        <h2 className="text-lg font-semibold text-center">{SAMPLE_PRODUCT.name}</h2>

        {/* Subtitle */}
        {theme.showSubtitle && (
          <p className="text-center italic text-sm">
            ({SAMPLE_PRODUCT.subtitle})
          </p>
        )}

        {/* Custom Fields */}
        <div className="text-sm mt-2 space-y-1">
          {theme.customFields &&
            theme.customFields.map((field) => {
              const showUnits = field.showUnits ?? true;
              const sampleValue =
                field.id === "colour"
                  ? "Red"
                  : field.id === "package"
                  ? "10"
                  : field.id === "agegroup"
                  ? "6"
                  : "Sample";

              return (
                <p key={field.id}>
                  {field.name}: {sampleValue}{" "}
                  {showUnits && field.defaultUnit !== "N/A"
                    ? field.defaultUnit
                    : ""}
                </p>
              );
            })}
        </div>
      </div>

      {/* Resell Price Bar */}
      {theme.showResellPrice && (
        <div
          style={{
            backgroundColor: SAMPLE_PRODUCT.bgColor,
            color: SAMPLE_PRODUCT.fontColor,
            padding: "8px",
            textAlign: "center",
            fontWeight: "normal",
            fontSize: 19,
          }}
        >
          Price&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;₹{SAMPLE_PRODUCT.resell}{" "}
          {SAMPLE_PRODUCT.resellUnit}
        </div>
      )}
    </div>
  );
}
