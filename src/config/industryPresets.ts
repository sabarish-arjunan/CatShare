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
      { label: "Design" },
      { label: "Sleeve" },
      { label: "Occasion" },
      { label: "Care Instructions" },
    ],
  },
  {
    name: "Lifestyle & Personal Care",
    fields: [
      { label: "Variant / Shade" },
      { label: "Volume / Weight", unitOptions: ["ml", "g", "kg", "oz"] },
      { label: "Skin / Hair Type" },
      { label: "Usage / Purpose" },
      { label: "Ingredients" },
      { label: "Fragrance" },
      { label: "Shelf Life" },
      { label: "Package Type" },
      { label: "Brand" },
      { label: "Safety Notes" },
    ],
  },
  {
    name: "Home, Kitchen & Living",
    fields: [
      { label: "Material" },
      { label: "Dimensions", unitOptions: ["inches", "cm", "mm"] },
      { label: "Colour" },
      { label: "Capacity" },
      { label: "Pack Count" },
      { label: "Room Type" },
      { label: "Care Instructions" },
      { label: "Brand" },
      { label: "Weight", unitOptions: ["g", "kg", "lbs"] },
      { label: "Country of Origin" },
    ],
  },
  {
    name: "Electronics & Accessories",
    fields: [
      { label: "Brand" },
      { label: "Warranty", unitOptions: ["months", "years"] },
      { label: "Rating" },
      { label: "Input / Output Type" },
      { label: "Connectivity" },
      { label: "Dimensions" },
      { label: "Package Contents" },
      { label: "Certification" },
      { label: "Compatibility" },
      { label: "Instructions" },
    ],
  },
  {
    name: "Hardware, Tools & Industrial",
    fields: [
      { label: "Specification" },
      { label: "Material" },
      { label: "Type" },
      { label: "Quality" },
      { label: "Coating" },
      { label: "Usage" },
      { label: "Certification" },
      { label: "Brand" },
      { label: "Warranty", unitOptions: ["months", "years"] },
      { label: "Package" },
    ],
  },
];
