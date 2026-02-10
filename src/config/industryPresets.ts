export interface FieldPreset {
  label: string;
  unitOptions?: string[];
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
      { label: "Package", unitOptions: ["pcs / set", "pcs / dozen", "pcs / pack"] },
      { label: "Age Group", unitOptions: ["months", "years"] },
      { label: "Size", unitOptions: ["S, M, L, XL", "28, 30, 32, 34", "Free Size"] },
      { label: "Fabric" },
      { label: "Fit" },
      { label: "Sleeve / Style" },
      { label: "Pattern / Design" },
      { label: "Others" },
    ],
  },
  {
    name: "Lifestyle & Personal Care",
    fields: [
      { label: "Brand" },
      { label: "Volume / Weight", unitOptions: ["ml", "g", "kg", "oz"] },
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
      { label: "Dimensions", unitOptions: ["inches", "cm", "mm"] },
      { label: "Weight", unitOptions: ["g", "kg", "lbs"] },
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
      { label: "Warranty", unitOptions: ["months", "years"] },
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
      { label: "Weight", unitOptions: ["kg", "lbs", "ton"] },
      { label: "Quantity" },
      { label: "Type" },
      { label: "Others" },
    ],
  },
];
