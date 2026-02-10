/**
 * Field Configuration System
 * 
 * This system allows apps to define custom product fields with:
 * - Standardized internal keys (field1, field2, field3, etc.)
 * - User-friendly display labels (e.g., "Colour", "Package", "Age Group")
 * - Field types and metadata
 * 
 * Old data stored with legacy names (color, package, age) is automatically
 * migrated to the new field structure without data loss.
 */

export interface FieldConfig {
  key: string; // Internal key: field1, field2, field3, etc.
  label: string; // Display label: "Colour", "Package", "Age Group"
  type: 'text' | 'number' | 'select';
  enabled?: boolean; // Whether the field is active for the current industry
  visible?: boolean; // Whether to show this field in product card (default: true if enabled)
  legacyKeys?: string[]; // Old field names for backward compatibility (e.g., ['color', 'colour'])
  unitField?: string; // Associated unit field (e.g., 'field2Unit' for packaging)
  unitOptions?: string[]; // Available units for this field
  defaultUnit?: string; // Default unit
}

export interface FieldsDefinition {
  version: number; // Version of field definition
  fields: FieldConfig[];
  industry?: string;
  lastUpdated: number;
}

// Default field configuration
export const DEFAULT_FIELDS: FieldConfig[] = [
  {
    key: 'field1',
    label: 'Colour',
    type: 'text',
    enabled: true,
    legacyKeys: ['color', 'colour', 'Colour'],
  },
  {
    key: 'field2',
    label: 'Package',
    type: 'text',
    enabled: true,
    legacyKeys: ['package', 'Package'],
    unitField: 'field2Unit',
    unitOptions: ['pcs / set', 'pcs / dozen', 'pcs / pack'],
    defaultUnit: 'pcs / set',
  },
  {
    key: 'field3',
    label: 'Age Group',
    type: 'text',
    enabled: true,
    legacyKeys: ['age', 'Age', 'Age group'],
    unitField: 'field3Unit',
    unitOptions: ['months', 'years'],
    defaultUnit: 'months',
  },
  {
    key: 'field4',
    label: 'Field 4',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field5',
    label: 'Field 5',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field6',
    label: 'Field 6',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field7',
    label: 'Field 7',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field8',
    label: 'Field 8',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field9',
    label: 'Field 9',
    type: 'text',
    enabled: false,
  },
  {
    key: 'field10',
    label: 'Field 10',
    type: 'text',
    enabled: false,
  },
  {
    key: 'price1',
    label: 'Price',
    type: 'number',
    enabled: true,
    legacyKeys: ['wholesale', 'Wholesale', 'Whole price'],
    unitField: 'price1Unit',
    unitOptions: ['/ piece', '/ dozen', '/ set'],
    defaultUnit: '/ piece',
  },
  {
    key: 'price2',
    label: 'Price 2',
    type: 'number',
    enabled: true,
    legacyKeys: ['resell', 'Resell', 'Resell price'],
    unitField: 'price2Unit',
    unitOptions: ['/ piece', '/ dozen', '/ set'],
    defaultUnit: '/ piece',
  },
];

/**
 * Get current field definition from localStorage
 * Falls back to default if not found
 */
export function getFieldsDefinition(): FieldsDefinition {
  try {
    const stored = localStorage.getItem('fieldsDefinition');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Failed to parse fieldsDefinition:', err);
  }

  // Return default with current timestamp
  return {
    version: 1,
    fields: DEFAULT_FIELDS,
    lastUpdated: Date.now(),
  };
}

/**
 * Save field definition to localStorage
 */
export function setFieldsDefinition(definition: FieldsDefinition): void {
  try {
    localStorage.setItem('fieldsDefinition', JSON.stringify({
      ...definition,
      lastUpdated: Date.now(),
    }));
  } catch (err) {
    console.error('Failed to save fieldsDefinition:', err);
  }
}

/**
 * Get a single field config by key
 */
export function getFieldConfig(key: string): FieldConfig | undefined {
  const definition = getFieldsDefinition();
  return definition.fields.find(f => f.key === key);
}

/**
 * Get field config by legacy key (for backward compatibility)
 * e.g., 'color' -> field1 config
 */
export function getFieldConfigByLegacyKey(legacyKey: string): FieldConfig | undefined {
  const definition = getFieldsDefinition();
  return definition.fields.find(f =>
    f.legacyKeys?.some(lk => lk.toLowerCase() === legacyKey.toLowerCase())
  );
}

/**
 * Map legacy field name to new field key
 * e.g., 'color' -> 'field1'
 */
export function mapLegacyKeyToNewKey(legacyKey: string): string | undefined {
  const config = getFieldConfigByLegacyKey(legacyKey);
  return config?.key;
}

/**
 * Get all field configs
 */
export function getAllFields(): FieldConfig[] {
  return getFieldsDefinition().fields;
}

/**
 * Reset to default field definitions
 */
export function resetToDefaultFields(): void {
  const definition: FieldsDefinition = {
    version: 1,
    fields: DEFAULT_FIELDS,
    industry: 'General Products (Custom)',
    lastUpdated: Date.now(),
  };
  setFieldsDefinition(definition);
}

/**
 * Map of legacy field keys to their ORIGINAL labels (before customization)
 * These are the default labels that existed when backups were first created
 */
const ORIGINAL_FIELD_LABELS: { [legacyKey: string]: { fieldKey: string; originalLabel: string } } = {
  'colour': { fieldKey: 'field1', originalLabel: 'Colour' },
  'color': { fieldKey: 'field1', originalLabel: 'Colour' },
  'package': { fieldKey: 'field2', originalLabel: 'Package' },
  'age': { fieldKey: 'field3', originalLabel: 'Age Group' },
  'wholesale': { fieldKey: 'price1', originalLabel: 'Price' },
  'resell': { fieldKey: 'price2', originalLabel: 'Price 2' },
};

/**
 * Analyze backup products to detect which legacy fields are present
 * and intelligently enable the corresponding current field definitions
 * Preserves ORIGINAL field labels from when the backup was created
 *
 * @param products - The products from the backup to analyze
 * @param isOldBackup - If true, forces industry to "Custom Fields (from Backup)"
 *
 * Returns an updated FieldsDefinition with appropriate fields enabled
 */
export function analyzeBackupFieldsAndUpdateDefinition(products: any[], isOldBackup: boolean = false): FieldsDefinition {
  if (!products || !Array.isArray(products) || products.length === 0) {
    console.warn('⚠️ No products to analyze for field detection');
    return getFieldsDefinition();
  }

  // Scan all products to detect which legacy field names are present
  const detectedLegacyFields = new Set<string>();
  const detectedFieldValues = new Map<string, any[]>();
  const detectedLegacyKeysUsed = new Map<string, string>(); // Maps fieldKey -> legacyKey that was found
  const unknownFields = new Set<string>();

  // Known metadata fields to skip
  const metadataFields = ['id', 'name', 'category', 'image', 'imagePath', 'imageFilename', 'imageBase64', 'imageData', 'renderedImages', 'description', 'sku', 'barcode'];

  for (const product of products) {
    if (!product || typeof product !== 'object') continue;

    for (const [key, value] of Object.entries(product)) {
      // Skip metadata fields
      if (metadataFields.includes(key)) {
        continue;
      }

      // Skip unit fields (they're paired with their main field)
      if (/Unit$/.test(key)) {
        continue;
      }

      let fieldFound = false;

      // Check if this key matches any legacy field definition
      for (const fieldConfig of DEFAULT_FIELDS) {
        if (fieldConfig.legacyKeys?.some(lk => lk.toLowerCase() === key.toLowerCase())) {
          detectedLegacyFields.add(fieldConfig.key);
          detectedLegacyKeysUsed.set(fieldConfig.key, key.toLowerCase()); // Remember which legacy key was found
          if (!detectedFieldValues.has(fieldConfig.key)) {
            detectedFieldValues.set(fieldConfig.key, []);
          }
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get(fieldConfig.key)!.push(value);
          }
          fieldFound = true;
          break;
        }
      }

      // Also check for new field format (field1, field2, price1, price2, etc.)
      if (!fieldFound && /^(field|price)\d+$/.test(key)) {
        detectedLegacyFields.add(key);
        if (!detectedFieldValues.has(key)) {
          detectedFieldValues.set(key, []);
        }
        if (value !== null && value !== undefined && value !== '') {
          detectedFieldValues.get(key)!.push(value);
        }
        fieldFound = true;
      }

      // If we didn't find a match, try fuzzy matching for common variants
      if (!fieldFound) {
        const keyLower = key.toLowerCase();

        // Try to match common field abbreviations and variants
        if (keyLower.includes('color') || keyLower.includes('colour') || keyLower === 'col') {
          detectedLegacyFields.add('field1');
          detectedLegacyKeysUsed.set('field1', 'colour');
          if (!detectedFieldValues.has('field1')) detectedFieldValues.set('field1', []);
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get('field1')!.push(value);
          }
          fieldFound = true;
          console.log(`   → Fuzzy matched "${key}" to field1 (Colour)`);
        } else if (keyLower.includes('package') || keyLower === 'pkg' || keyLower.includes('pack')) {
          detectedLegacyFields.add('field2');
          detectedLegacyKeysUsed.set('field2', 'package');
          if (!detectedFieldValues.has('field2')) detectedFieldValues.set('field2', []);
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get('field2')!.push(value);
          }
          fieldFound = true;
          console.log(`   → Fuzzy matched "${key}" to field2 (Package)`);
        } else if (keyLower.includes('age') || keyLower.includes('group') || keyLower === 'agegroup') {
          detectedLegacyFields.add('field3');
          detectedLegacyKeysUsed.set('field3', 'age');
          if (!detectedFieldValues.has('field3')) detectedFieldValues.set('field3', []);
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get('field3')!.push(value);
          }
          fieldFound = true;
          console.log(`   → Fuzzy matched "${key}" to field3 (Age Group)`);
        } else if (keyLower.includes('wholesale') || keyLower.includes('wholeprice') || keyLower === 'wprice') {
          detectedLegacyFields.add('price1');
          detectedLegacyKeysUsed.set('price1', 'wholesale');
          if (!detectedFieldValues.has('price1')) detectedFieldValues.set('price1', []);
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get('price1')!.push(value);
          }
          fieldFound = true;
          console.log(`   → Fuzzy matched "${key}" to price1 (Wholesale Price)`);
        } else if (keyLower.includes('resell') || keyLower.includes('resale') || keyLower === 'rprice') {
          detectedLegacyFields.add('price2');
          detectedLegacyKeysUsed.set('price2', 'resell');
          if (!detectedFieldValues.has('price2')) detectedFieldValues.set('price2', []);
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get('price2')!.push(value);
          }
          fieldFound = true;
          console.log(`   → Fuzzy matched "${key}" to price2 (Resell Price)`);
        }
      }

      // If still no match and has value, track as unknown field
      if (!fieldFound && value !== null && value !== undefined && value !== '') {
        unknownFields.add(key);
      }
    }
  }

  console.log('🔍 Detected legacy fields in backup:', Array.from(detectedLegacyFields));
  if (unknownFields.size > 0) {
    console.warn('⚠️ Unknown fields in backup (may be from older version):', Array.from(unknownFields));
  }

  // Get current field definition
  let definition = getFieldsDefinition();

  // Update field definitions: enable fields that are detected in the backup
  // AND restore original labels if they were changed
  const updatedFields = definition.fields.map(fieldConfig => {
    // Check if this field was detected in the backup
    const isDetected = detectedLegacyFields.has(fieldConfig.key);
    const hasValues = detectedFieldValues.has(fieldConfig.key) && detectedFieldValues.get(fieldConfig.key)!.length > 0;

    if (isDetected && hasValues) {
      // Get the legacy key that was found
      const detectedLegacyKey = detectedLegacyKeysUsed.get(fieldConfig.key);

      // Look up the original label for this legacy key
      const originalInfo = detectedLegacyKey ? ORIGINAL_FIELD_LABELS[detectedLegacyKey] : null;
      const originalLabel = originalInfo?.originalLabel;

      // Use original label if found, otherwise keep current label
      const label = originalLabel || fieldConfig.label;

      console.log(`✅ Enabling field: ${fieldConfig.key} (${label}) - detected ${detectedFieldValues.get(fieldConfig.key)!.length} products with values`);

      return {
        ...fieldConfig,
        label: label, // Restore original label if it was changed
        enabled: true, // Enable the field since we found data for it
      };
    } else if (fieldConfig.enabled) {
      // Keep existing enabled state
      return fieldConfig;
    }

    return fieldConfig;
  });

  // Handle unknown fields: enable additional fields if backup has more data than current definition knows about
  if (unknownFields.size > 0) {
    console.log('📊 Backup contains additional fields not in current definition - enabling extra fields');

    // Enable some disabled fields to accommodate unknown fields
    const unknownFieldCount = unknownFields.size;
    let enabledCount = 0;

    for (let i = 0; i < updatedFields.length && enabledCount < unknownFieldCount; i++) {
      const field = updatedFields[i];
      // Enable additional text fields if they're not already enabled and not core fields
      if (!field.enabled && field.key.startsWith('field') && !['field1', 'field2', 'field3'].includes(field.key)) {
        updatedFields[i] = { ...field, enabled: true };
        enabledCount++;
        console.log(`✅ Enabling extra field: ${field.key} (${field.label}) - to accommodate backup data`);
      }
    }
  }

  // For old backups (without fieldsDefinition in the backup file), set industry to "General Products (Custom)"
  // This uses the existing Custom/General template for old backups
  const backupIndustry = isOldBackup ? 'General Products (Custom)' : (definition.industry || 'General Products (Custom)');

  // Create updated definition
  const updatedDefinition: FieldsDefinition = {
    version: 1,
    fields: updatedFields,
    industry: backupIndustry,
    lastUpdated: Date.now(),
  };

  console.log('📋 Updated field definition with detected fields');
  console.log('   Industry/Template:', backupIndustry);
  console.log('   Enabled fields:', updatedDefinition.fields.filter(f => f.enabled).map(f => `${f.key}(${f.label})`).join(', '));

  return updatedDefinition;
}

/**
 * Analyze backup and apply field configuration intelligently
 * This should be called during backup restore
 *
 * @param products - The products from the backup
 * @param isOldBackup - If true, indicates this is an old backup without fieldsDefinition
 */
export function applyBackupFieldAnalysis(products: any[], isOldBackup: boolean = false): void {
  try {
    console.log('🔎 Analyzing backup fields...');
    const updatedDefinition = analyzeBackupFieldsAndUpdateDefinition(products, isOldBackup);
    setFieldsDefinition(updatedDefinition);
    console.log('✅ Backup field analysis complete - field definitions updated');
  } catch (err) {
    console.error('❌ Error analyzing backup fields:', err);
    // Don't throw - continue with current field definition
  }
}
