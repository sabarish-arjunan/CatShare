/**
 * Utilities for managing per-catalogue product data
 * 
 * Products can have catalogue-specific details (price, stock, etc.)
 * while keeping image, name, and basic info common across all catalogues.
 */

import { getAllCatalogues } from './catalogueConfig';

export interface CatalogueData {
  enabled: boolean;
  field1?: string;
  field2?: string;
  field3?: string;
  price1?: string;
  price1Unit?: string;
  price2?: string;
  price2Unit?: string;
  field2Unit?: string;
  field3Unit?: string;
  stock?: boolean;
  wholesaleStock?: boolean;
  resellStock?: boolean;
  [key: string]: any;
}

export interface ProductWithCatalogueData {
  id: string;
  name: string;
  subtitle?: string;
  imagePath?: string;
  image?: string;
  fontColor?: string;
  bgColor?: string;
  imageBgColor?: string;
  badge?: string;
  category?: string[];
  catalogueData?: Record<string, CatalogueData>;
  [key: string]: any;
}

/**
 * Initialize catalogue data for a product
 * Creates empty catalogue entries for all available catalogues
 */
export function initializeCatalogueData(product?: ProductWithCatalogueData): Record<string, CatalogueData> {
  const catalogues = getAllCatalogues();
  const catalogueData: Record<string, CatalogueData> = {};

  catalogues.forEach((cat) => {
    catalogueData[cat.id] = {
      enabled: cat.id === 'cat1' ? true : false, // Enable cat1 by default
      field1: product?.field1 || "",
      field2: product?.field2 || "",
      field3: product?.field3 || "",
      price1: product?.price1 || "",
      price1Unit: product?.price1Unit || "/ piece",
      price2: product?.price2 || "",
      price2Unit: product?.price2Unit || "/ piece",
      field2Unit: product?.field2Unit || product?.packageUnit || "pcs / set",
      field3Unit: product?.field3Unit || product?.ageUnit || "months",
      stock: product?.stock !== false,
      wholesaleStock: product?.wholesaleStock !== false,
      resellStock: product?.resellStock !== false,
    };
  });

  return catalogueData;
}

/**
 * Get catalogue data for a specific catalogue
 * Falls back to default values if the catalogue doesn't have specific data
 */
export function getCatalogueData(product: ProductWithCatalogueData, catalogueId: string): CatalogueData {
  if (!product.catalogueData) {
    return initializeCatalogueData(product)[catalogueId] || getDefaultCatalogueData(catalogueId);
  }

  const data = product.catalogueData[catalogueId];

  // If not found, return defaults for this catalogue
  if (!data) {
    return getDefaultCatalogueData(catalogueId);
  }

  // Ensure all required fields exist by merging with defaults
  return {
    ...getDefaultCatalogueData(catalogueId),
    ...data
  };
}

/**
 * Get default catalogue data structure
 */
export function getDefaultCatalogueData(catalogueId: string): CatalogueData {
  return {
    enabled: catalogueId === 'cat1',
    field1: "",
    field2: "",
    field3: "",
    price1: "",
    price1Unit: "/ piece",
    price2: "",
    price2Unit: "/ piece",
    field2Unit: "pcs / set",
    field3Unit: "months",
    stock: true,
    wholesaleStock: true,
    resellStock: true,
  };
}

/**
 * Set catalogue data for a specific catalogue
 */
export function setCatalogueData(
  product: ProductWithCatalogueData,
  catalogueId: string,
  data: Partial<CatalogueData>
): ProductWithCatalogueData {
  if (!product.catalogueData) {
    product.catalogueData = initializeCatalogueData(product);
  }

  product.catalogueData[catalogueId] = {
    ...product.catalogueData[catalogueId],
    ...data,
  };

  return product;
}

/**
 * Check if a product is enabled for a catalogue
 */
export function isProductEnabledForCatalogue(product: ProductWithCatalogueData, catalogueId: string): boolean {
  if (!product.catalogueData) return catalogueId === 'cat1';
  return product.catalogueData[catalogueId]?.enabled || false;
}

/**
 * Enable/disable product for a catalogue
 */
export function setProductEnabledForCatalogue(
  product: ProductWithCatalogueData,
  catalogueId: string,
  enabled: boolean
): ProductWithCatalogueData {
  if (!product.catalogueData) {
    product.catalogueData = initializeCatalogueData(product);
  }

  if (!product.catalogueData[catalogueId]) {
    product.catalogueData[catalogueId] = { enabled };
  } else {
    product.catalogueData[catalogueId].enabled = enabled;
  }

  return product;
}

/**
 * Get all enabled catalogues for a product
 */
export function getEnabledCatalogues(product: ProductWithCatalogueData): string[] {
  if (!product.catalogueData) {
    return ['cat1'];
  }

  return Object.entries(product.catalogueData)
    .filter(([_, data]) => data.enabled)
    .map(([catId, _]) => catId);
}

/**
 * Ensure product has proper catalogue data structure
 * Used during migration from old product format
 */
export function ensureProductHasCatalogueData(product: ProductWithCatalogueData): ProductWithCatalogueData {
  if (!product.catalogueData) {
    product.catalogueData = initializeCatalogueData(product);
  }

  return product;
}
