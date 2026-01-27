/**
 * Data Migration Utility
 * 
 * Handles migration of old product data to new catalogue system
 * Ensures backward compatibility - old data works without any changes
 */

import { getCataloguesDefinition, DEFAULT_CATALOGUES } from "../config/catalogueConfig";

/**
 * Check if this is the first time the app is running with the new catalogue system
 * by checking if cataloguesDefinition exists in localStorage
 */
export function isFirstTimeWithNewSystem(): boolean {
  return localStorage.getItem("cataloguesDefinition") === null;
}

/**
 * Initialize catalogues on first run with new system
 * If there's legacy product data, this ensures backwards compatibility
 */
export function initializeCataloguesIfNeeded(): void {
  if (!isFirstTimeWithNewSystem()) {
    return; // Already initialized
  }

  // First time setup - set default catalogues
  try {
    localStorage.setItem(
      "cataloguesDefinition",
      JSON.stringify({
        version: 1,
        catalogues: DEFAULT_CATALOGUES,
        lastUpdated: Date.now(),
      })
    );
    console.log("✅ Initialized default catalogues for first run");
  } catch (err) {
    console.error("❌ Failed to initialize catalogues:", err);
  }
}

/**
 * Verify that all products have required stock fields
 * Creates missing stock fields for catalogues to prevent errors
 */
export function ensureProductsHaveStockFields(): void {
  try {
    const products = JSON.parse(localStorage.getItem("products") || "[]");
    const catalogues = JSON.parse(
      localStorage.getItem("cataloguesDefinition") || JSON.stringify({
        catalogues: DEFAULT_CATALOGUES,
      })
    ).catalogues;

    let modified = false;

    for (const product of products) {
      for (const cat of catalogues) {
        // Ensure stock field exists
        if (product[cat.stockField] === undefined) {
          product[cat.stockField] = true; // Default to in-stock
          modified = true;
        }

        // Ensure price field exists (at least empty string)
        if (product[cat.priceField] === undefined) {
          product[cat.priceField] = "";
          modified = true;
        }

        // Ensure unit field exists
        if (product[cat.priceUnitField] === undefined) {
          product[cat.priceUnitField] = "/ piece";
          modified = true;
        }
      }
    }

    if (modified) {
      localStorage.setItem("products", JSON.stringify(products));
      console.log("✅ Ensured all products have required stock fields");
    }
  } catch (err) {
    console.error("❌ Failed to ensure stock fields:", err);
  }
}

/**
 * Validate catalogue configuration
 * Ensures:
 * - At least one catalogue exists
 * - All catalogues have required fields
 * - All field names are unique
 */
export function validateCatalogueConfig(): boolean {
  try {
    const definition = getCataloguesDefinition();

    if (!definition.catalogues || definition.catalogues.length === 0) {
      console.error("❌ No catalogues defined");
      return false;
    }

    const priceFields = new Set<string>();
    const stockFields = new Set<string>();

    for (const cat of definition.catalogues) {
      // Check required fields
      if (!cat.id || !cat.label || !cat.priceField || !cat.stockField) {
        console.error(`❌ Catalogue ${cat.label} missing required fields`);
        return false;
      }

      // Check for duplicates
      if (priceFields.has(cat.priceField)) {
        console.error(`❌ Duplicate price field: ${cat.priceField}`);
        return false;
      }
      if (stockFields.has(cat.stockField)) {
        console.error(`❌ Duplicate stock field: ${cat.stockField}`);
        return false;
      }

      priceFields.add(cat.priceField);
      stockFields.add(cat.stockField);
    }

    console.log("✅ Catalogue configuration is valid");
    return true;
  } catch (err) {
    console.error("❌ Failed to validate catalogue config:", err);
    return false;
  }
}

/**
 * Run all migration and validation steps
 * Should be called on app startup
 */
export function runMigrations(): void {
  console.log("🔄 Running data migrations...");

  // Step 1: Initialize catalogues if needed
  initializeCataloguesIfNeeded();

  // Step 2: Ensure all products have required fields
  ensureProductsHaveStockFields();

  // Step 3: Validate configuration
  const isValid = validateCatalogueConfig();

  if (isValid) {
    console.log("✅ All migrations completed successfully");
  } else {
    console.warn(
      "⚠️ Migrations completed with warnings - some validation checks failed"
    );
  }
}

/**
 * Get migration status for display in UI
 * Returns info about what needs to be done
 */
export function getMigrationStatus(): {
  needsMigration: boolean;
  message: string;
  hasLegacyData: boolean;
} {
  const hasLegacyData =
    localStorage.getItem("products")?.includes('"price1"') ||
    localStorage.getItem("products")?.includes('"wholesaleStock"') ||
    false;

  const hasNewSystem = localStorage.getItem("cataloguesDefinition") !== null;

  return {
    needsMigration: hasLegacyData && !hasNewSystem,
    message: hasNewSystem
      ? "Using new catalogue system (compatible with legacy data)"
      : "Legacy product system detected",
    hasLegacyData,
  };
}
