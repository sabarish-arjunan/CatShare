export interface FieldPreset {
  label: string;
  defaultUnits?: string[];
}

export interface IndustryPreset {
  name: string;
  fields: FieldPreset[];
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    name: "Fashion & Apparel",
    fields: [
      { label: "Colour" },
      { label: "Size", defaultUnits: ["S, M, L, XL", "28, 30, 32, 34", "Free Size"] },
      { label: "Fabric" },
      { label: "Fit" },
      { label: "Sleeve / Style" },
      { label: "Age Group", defaultUnits: ["months", "years"] },
      { label: "Pattern / Design" },
      { label: "Package / Set", defaultUnits: ["pcs / set", "pcs / dozen", "pcs / pack"] },
      { label: "Others" },
    ],
  },
  {
    name: "Lifestyle & Personal Care",
    fields: [
      { label: "Brand" },
      { label: "Volume / Weight", defaultUnits: ["ml", "g", "kg", "oz"] },
      { label: "Type" },
      { label: "Fragrance" },
      { label: "Skin Type" },
      { label: "Ingredients" },
      { label: "Pack Size" },
      { label: "Others" },
    ],
  },
  {
    name: "Home, Kitchen & Living",
    fields: [
      { label: "Material" },
      { label: "Dimensions", defaultUnits: ["inches", "cm", "mm"] },
      { label: "Weight", defaultUnits: ["g", "kg", "lbs"] },
      { label: "Color" },
      { label: "Brand" },
      { label: "Style" },
      { label: "Room" },
      { label: "Others" },
    ],
  },
  {
    name: "Electronics & Accessories",
    fields: [
      { label: "Model" },
      { label: "Brand" },
      { label: "Color" },
      { label: "Specifications" },
      { label: "Warranty", defaultUnits: ["months", "years"] },
      { label: "Compatibility" },
      { label: "Features" },
      { label: "Others" },
    ],
  },
  {
    name: "Hardware, Tools & Industrial",
    fields: [
      { label: "Material" },
      { label: "Grade" },
      { label: "Size" },
      { label: "Brand" },
      { label: "Weight", defaultUnits: ["kg", "lbs", "ton"] },
      { label: "Quantity" },
      { label: "Type" },
      { label: "Others" },
    ],
  },
];
