/**
 * Field Initialization
 * 
 * Call this function once when the app starts to:
 * 1. Initialize field configuration if not present
 * 2. Migrate existing products to new field structure
 * 3. Ensure backward compatibility
 */

import {
  getFieldsDefinition,
  setFieldsDefinition,
  resetToDefaultFields,
  DEFAULT_FIELDS,
} from './fieldConfig';
import {
  migrateProductsInStorage,
  isMigrationDone,
} from './fieldMigration';

/**
 * Initialize the field system
 * Call this once during app startup
 * 
 * Safe to call multiple times - idempotent operation
 */
export function initializeFieldSystem(): void {
  console.log('🔧 Initializing field system...');

  try {
    // 1. Ensure field definition exists
    const definition = getFieldsDefinition();
    if (!definition.fields || definition.fields.length === 0) {
      console.log('📋 Field definition not found, initializing defaults...');
      resetToDefaultFields();
    }

    // 2. Migrate existing products if needed
    if (!isMigrationDone()) {
      console.log('🔄 Migrating existing products to new field structure...');
      const migrated = migrateProductsInStorage();
      if (migrated) {
        console.log('✅ Migration completed successfully');
      } else {
        console.log('ℹ️  No legacy products found or already migrated');
      }
    } else {
      console.log('✅ Products already migrated');
    }

    console.log('✅ Field system initialized');
  } catch (err) {
    console.error('❌ Failed to initialize field system:', err);
    // Don't throw - allow app to continue even if initialization fails
  }
}

/**
 * Reset field system to defaults
 * Use this for debugging or to reset the app
 */
export function resetFieldSystem(): void {
  console.warn('⚠️  Resetting field system to defaults...');
  localStorage.removeItem('productsMigrationDone');
  resetToDefaultFields();
  console.log('✅ Field system reset complete');
}
