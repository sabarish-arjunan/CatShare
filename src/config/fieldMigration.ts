/**
 * Data Migration System
 * 
 * Handles automatic migration of products from old field naming scheme
 * to new field naming scheme while preserving all data.
 * 
 * Old format: { id, name, color, package, age, ageUnit, packageUnit, ... }
 * New format: { id, name, field1, field2, field2Unit, field3, field3Unit, ... }
 */

import {
  getFieldsDefinition,
  mapLegacyKeyToNewKey,
  getFieldConfigByLegacyKey,
} from './fieldConfig';

interface LegacyProduct {
  id?: string;
  name?: string;
  [key: string]: any;
}

interface MigratedProduct {
  id?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Check if a product uses the old field naming scheme
 */
export function isLegacyProduct(product: any): boolean {
  if (!product) return false;

  // Check for legacy field names
  const legacyFieldNames = ['color', 'colour', 'package', 'age'];
  return legacyFieldNames.some(name => name in product);
}

/**
 * Migrate a single product from legacy format to new format
 * Preserves all data and creates both new and old field names for compatibility
 */
export function migrateProductToNewFormat(product: LegacyProduct): MigratedProduct {
  if (!isLegacyProduct(product)) {
    return product; // Already migrated or new product
  }

  const migrated: MigratedProduct = { ...product };
  const definition = getFieldsDefinition();

  // Iterate through all fields in the definition
  for (const fieldConfig of definition.fields) {
    // Find which legacy key matches this field config
    if (fieldConfig.legacyKeys) {
      for (const legacyKey of fieldConfig.legacyKeys) {
        if (legacyKey in product) {
          // Found matching legacy key
          const value = product[legacyKey];

          // Set the new field key
          migrated[fieldConfig.key] = value;

          // If this field has a unit, migrate that too
          if (fieldConfig.unitField && fieldConfig.legacyKeys) {
            // Look for legacy unit field (e.g., 'packageUnit' for 'package')
            const legacyUnitKey = legacyKey + 'Unit'; // e.g., 'packageUnit', 'ageUnit'
            if (legacyUnitKey in product) {
              migrated[fieldConfig.unitField] = product[legacyUnitKey];
            } else if (fieldConfig.defaultUnit && !(fieldConfig.unitField in migrated)) {
              migrated[fieldConfig.unitField] = fieldConfig.defaultUnit;
            }
          }

          // Keep the legacy field for backward compatibility during read operations
          // Don't remove it so that any code still using legacy names continues to work
          break;
        }
      }

      // If no legacy key was found but field has a unit, ensure default unit is set
      if (fieldConfig.unitField && !(fieldConfig.unitField in migrated) && fieldConfig.defaultUnit) {
        migrated[fieldConfig.unitField] = fieldConfig.defaultUnit;
      }
    }
  }

  return migrated;
}

/**
 * Migrate all products in storage from legacy format to new format
 * This is typically called once during app initialization
 * 
 * Returns true if migration was performed, false if already migrated
 */
export function migrateProductsInStorage(): boolean {
  try {
    const stored = localStorage.getItem('products');
    if (!stored) return false;

    const products = JSON.parse(stored);
    const hasLegacyProducts = Array.isArray(products) && products.some(p => isLegacyProduct(p));

    if (!hasLegacyProducts) return false;

    // Migrate all products
    const migratedProducts = products.map(p => migrateProductToNewFormat(p));

    // Save back to storage
    localStorage.setItem('products', JSON.stringify(migratedProducts));

    // Mark migration as complete
    localStorage.setItem('productsMigrationDone', JSON.stringify({
      version: 1,
      migratedAt: Date.now(),
    }));

    console.log('✅ Products migrated to new field structure');
    return true;
  } catch (err) {
    console.error('❌ Failed to migrate products:', err);
    return false;
  }
}

/**
 * Check if products have already been migrated
 */
export function isMigrationDone(): boolean {
  try {
    const stored = localStorage.getItem('productsMigrationDone');
    return !!stored;
  } catch {
    return false;
  }
}

/**
 * Sync operation: When writing a product, ensure it has BOTH legacy and new field names
 * This allows the app to work with both old and new naming schemes simultaneously
 */
export function syncProductFieldNames(product: MigratedProduct): MigratedProduct {
  const synced = { ...product };
  const definition = getFieldsDefinition();

  for (const fieldConfig of definition.fields) {
    // If product has new field key but no legacy keys, create them
    if (fieldConfig.key in product && fieldConfig.legacyKeys) {
      const value = product[fieldConfig.key];
      for (const legacyKey of fieldConfig.legacyKeys) {
        if (!(legacyKey in synced)) {
          synced[legacyKey] = value;
        }
      }

      // Also sync units if applicable
      if (fieldConfig.unitField && fieldConfig.legacyKeys?.[0]) {
        const legacyUnitKey = fieldConfig.legacyKeys[0] + 'Unit';
        if (fieldConfig.unitField in product && !(legacyUnitKey in synced)) {
          synced[legacyUnitKey] = product[fieldConfig.unitField];
        }
      }
    }
  }

  return synced;
}

/**
 * Helper: Get field value from a product (works with both old and new names)
 * Prefers new field name if both exist
 */
export function getProductFieldValue(product: any, fieldKey: string): any {
  const definition = getFieldsDefinition();
  const fieldConfig = definition.fields.find(f => f.key === fieldKey);
  if (!fieldConfig) return undefined;

  // Try new key first
  if (fieldKey in product) {
    return product[fieldKey];
  }

  // Fall back to legacy keys
  if (fieldConfig.legacyKeys) {
    for (const legacyKey of fieldConfig.legacyKeys) {
      if (legacyKey in product) {
        return product[legacyKey];
      }
    }
  }

  return undefined;
}

/**
 * Helper: Get unit value from a product (works with both old and new names)
 */
export function getProductUnitValue(product: any, fieldKey: string): string | undefined {
  const definition = getFieldsDefinition();
  const fieldConfig = definition.fields.find(f => f.key === fieldKey);
  if (!fieldConfig?.unitField) return undefined;

  // Try new unit key first
  if (fieldConfig.unitField in product) {
    return product[fieldConfig.unitField];
  }

  // Fall back to legacy unit key
  if (fieldConfig.legacyKeys?.[0]) {
    const legacyUnitKey = fieldConfig.legacyKeys[0] + 'Unit';
    if (legacyUnitKey in product) {
      return product[legacyUnitKey];
    }
  }

  return fieldConfig.defaultUnit;
}
