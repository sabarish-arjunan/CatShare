/**
 * Data Migration Utility
 * 
 * Handles migration of old product data to new catalogue system
 * Ensures backward compatibility - old data works without any changes
 */

import { getCataloguesDefinition, setCataloguesDefinition, DEFAULT_CATALOGUES } from "../config/catalogueConfig";

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
    const definition = JSON.parse(
      localStorage.getItem("cataloguesDefinition") || JSON.stringify({
        catalogues: DEFAULT_CATALOGUES,
      })
    );
    const catalogues = definition.catalogues || DEFAULT_CATALOGUES;

    let modified = false;

    for (const product of products) {
      // Ensure catalogueData structure exists (for new multi-catalogue system)
      if (!product.catalogueData) {
        product.catalogueData = {};
        modified = true;
      }

      for (const cat of catalogues) {
        // Initialize catalogueData for this catalogue if missing
        if (!product.catalogueData[cat.id]) {
          product.catalogueData[cat.id] = {
            enabled: cat.id === 'cat1' ? true : false, // Enable cat1 by default for old products
            field1: product.field1 || "",
            field2: product.field2 || "",
            field3: product.field3 || "",
            field2Unit: product.field2Unit || product.packageUnit || "pcs / set",
            field3Unit: product.field3Unit || product.ageUnit || "months",
            [cat.priceField]: product[cat.priceField] || "",
            [cat.priceUnitField]: product[cat.priceUnitField] || "/ piece",
            [cat.stockField]: product[cat.stockField] !== undefined ? product[cat.stockField] : true,
          };
          modified = true;
        }

        // Ensure stock field exists on product level (for backward compatibility)
        if (product[cat.stockField] === undefined) {
          product[cat.stockField] = product.catalogueData[cat.id]?.[cat.stockField] ?? true;
          modified = true;
        }

        // Ensure price field exists (at least empty string)
        if (product[cat.priceField] === undefined) {
          product[cat.priceField] = product.catalogueData[cat.id]?.[cat.priceField] ?? "";
          modified = true;
        }

        // Ensure unit field exists
        if (product[cat.priceUnitField] === undefined) {
          product[cat.priceUnitField] = product.catalogueData[cat.id]?.[cat.priceUnitField] ?? "/ piece";
          modified = true;
        }
      }
    }

    if (modified) {
      localStorage.setItem("products", JSON.stringify(products));
      console.log("✅ Ensured all products have required stock fields and catalogueData structure");
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
 * - AUTOMATICALLY FIXES DUPLICATES
 */
export function validateCatalogueConfig(): boolean {
  try {
    const definition = getCataloguesDefinition();
    let modified = false;

    if (!definition.catalogues || definition.catalogues.length === 0) {
      console.error("❌ No catalogues defined, resetting to defaults");
      localStorage.setItem("cataloguesDefinition", JSON.stringify({
        version: 1,
        catalogues: DEFAULT_CATALOGUES,
        lastUpdated: Date.now()
      }));
      return true;
    }

    const priceFields = new Set<string>();
    const stockFields = new Set<string>();
    const validCatalogues = [];

    for (const cat of definition.catalogues) {
      // Check required fields
      if (!cat.id || !cat.label || !cat.priceField || !cat.stockField) {
        console.warn(`⚠️ Catalogue ${cat.label || 'Unknown'} missing required fields, removing`);
        modified = true;
        continue;
      }

      // Check for duplicates
      if (priceFields.has(cat.priceField)) {
        console.error(`❌ Duplicate price field detected: ${cat.priceField}. Removing duplicate catalogue: ${cat.label}`);
        modified = true;
        continue;
      }
      if (stockFields.has(cat.stockField)) {
        console.error(`❌ Duplicate stock field detected: ${cat.stockField}. Removing duplicate catalogue: ${cat.label}`);
        modified = true;
        continue;
      }

      priceFields.add(cat.priceField);
      stockFields.add(cat.stockField);
      validCatalogues.push(cat);
    }

    if (modified) {
      definition.catalogues = validCatalogues;
      setCataloguesDefinition(definition);
      console.log("✅ Automatically fixed catalogue configuration issues");
    }

    console.log("✅ Catalogue configuration check complete");
    return true;
  } catch (err) {
    console.error("❌ Failed to validate catalogue config:", err);
    return false;
  }
}

/**
 * Migrate from old 2-catalogue system to new single-catalogue default
 * For existing users: remove cat2 (Resell) if there's no resell data in products
 * This ensures users see "Master" as the default, not "Catalogue 2"
 */
export function migrateFromTwoCataloguesToOne(): void {
  try {
    const definition = getCataloguesDefinition();
    const products = JSON.parse(localStorage.getItem("products") || "[]");

    // Check if cat2 (Resell) exists
    const cat2Index = definition.catalogues.findIndex((c) => c.id === "cat2");
    if (cat2Index === -1) {
      return; // Nothing to migrate
    }

    // Check if there's any resell data in products
    const hasResellData = products.some(
      (p: any) =>
        (p.resellStock !== undefined && p.resellStock !== null) ||
        (p.price2 !== undefined && p.price2 !== null) ||
        (p.catalogueData?.cat2?.enabled === true)
    );

    // If no resell data, remove cat2 from catalogues
    if (!hasResellData) {
      definition.catalogues = definition.catalogues.filter((c) => c.id !== "cat2");
      setCataloguesDefinition(definition);
      console.log("✅ Migrated from 2-catalogue to 1-catalogue system (removed empty Resell catalogue)");
    } else {
      // Resell data exists, but make sure it's NOT marked as default
      if (definition.catalogues[cat2Index].isDefault === true) {
        definition.catalogues[cat2Index].isDefault = false;
        setCataloguesDefinition(definition);
        console.log("✅ Resell catalogue kept for backward compatibility, but unmarked as default");
      } else {
        console.log("ℹ️ Keeping Resell catalogue - resell data found in products");
      }
    }
  } catch (err) {
    console.error("❌ Failed to migrate catalogue structure:", err);
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

  // Step 2: Migrate from old 2-catalogue to 1-catalogue system if applicable
  migrateFromTwoCataloguesToOne();

  // Step 3: Ensure all products have required fields
  ensureProductsHaveStockFields();

  // Step 4: Validate configuration
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
