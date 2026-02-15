/**
 * Data Migration Utility
 * 
 * Handles migration of old product data to new catalogue system
 * Ensures backward compatibility - old data works without any changes
 */

import { getCataloguesDefinition, setCataloguesDefinition, DEFAULT_CATALOGUES } from "../config/catalogueConfig";
import { Filesystem, Directory } from "@capacitor/filesystem";

/**
 * Move base64 images to Filesystem and remove from localStorage
 * This is CRITICAL for preventing QuotaExceededError
 */
export async function cleanupProductStorage(): Promise<void> {
  try {
    const stored = localStorage.getItem("products");
    if (!stored) return;

    const products = JSON.parse(stored);
    let modified = false;

    for (const p of products) {
      // 1. If product has base64 image, move it to Filesystem
      if (p.image && typeof p.image === 'string' && p.image.startsWith("data:image")) {
        const id = p.id || Date.now().toString();
        const imagePath = `catalogue/product-${id}.png`;
        const base64Data = p.image.split(",")[1];

        try {
          await Filesystem.writeFile({
            path: imagePath,
            data: base64Data,
            directory: Directory.Data,
            recursive: true,
          });

          p.imagePath = imagePath;
          delete p.image;
          modified = true;
          console.log(`📦 Moved image for product ${id} to Filesystem`);
        } catch (fsErr) {
          console.error(`❌ Failed to move image for product ${id}:`, fsErr);
        }
      } else if (p.image) {
        // If image exists but isn't base64 (maybe a legacy path),
        // and we already have imagePath, just delete the redundant field.
        if (p.imagePath) {
          delete p.image;
          modified = true;
        }
      }

      // 2. Clean up other redundant base64 data if any
      // Some old versions might have stored rendered images in products (rare but possible)
      if (p.renderedImage) {
        delete p.renderedImage;
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem("products", JSON.stringify(products));
      console.log("✅ Cleanup: All base64 images moved to Filesystem and localStorage freed");
    }
  } catch (err) {
    console.error("❌ Failed to cleanup product storage:", err);
  }
}

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
            badge: product.badge || "",
            [cat.priceField]: product[cat.priceField] || "",
            [cat.priceUnitField]: product[cat.priceUnitField] || "/ piece",
            [cat.stockField]: product[cat.stockField] !== undefined ? product[cat.stockField] : true,
          };
          modified = true;
        } else {
          // For existing catalogueData, ensure badge field is present
          // This handles restored backups where badge might already be in catalogueData
          if (!product.catalogueData[cat.id].badge && product.badge) {
            product.catalogueData[cat.id].badge = product.badge;
            modified = true;
          }
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
 * Migration: Ensure watermark is enabled by default for existing users
 * if they haven't explicitly set it or if it was the old default false.
 */
export function migrateWatermarkDefault(): void {
  try {
    const showWatermark = localStorage.getItem("showWatermark");
    const hasMigrated = localStorage.getItem("hasMigratedWatermarkDefault");

    if (!hasMigrated) {
      // If never set OR if set to false (old default), force to true for migration
      // This ensures existing users who were on the old 'false' default get the new 'true' default once.
      if (showWatermark === null || showWatermark === "false") {
        localStorage.setItem("showWatermark", "true");
        console.log("✅ Migrated watermark default to enabled");
      }
      localStorage.setItem("hasMigratedWatermarkDefault", "true");
    }
  } catch (err) {
    console.error("❌ Failed to migrate watermark default:", err);
  }
}

/**
 * Run all migration and validation steps
 * Should be called on app startup
 */
export async function runMigrations(): Promise<void> {
  console.log("🔄 Running data migrations...");

  // Step 0: Critical cleanup for storage quota
  await cleanupProductStorage();

  // Step 1: Initialize catalogues if needed
  initializeCataloguesIfNeeded();

  // Step 2: Migrate from old 2-catalogue to 1-catalogue system if applicable
  migrateFromTwoCataloguesToOne();

  // Step 3: Migrate watermark default
  migrateWatermarkDefault();

  // Step 4: Ensure all products have required fields
  ensureProductsHaveStockFields();

  // Step 5: Validate configuration
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
