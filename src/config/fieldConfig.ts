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
 * Analyze backup products to detect which legacy fields are present
 * and intelligently enable the corresponding current field definitions
 *
 * Returns an updated FieldsDefinition with appropriate fields enabled
 */
export function analyzeBackupFieldsAndUpdateDefinition(products: any[]): FieldsDefinition {
  if (!products || !Array.isArray(products) || products.length === 0) {
    console.warn('⚠️ No products to analyze for field detection');
    return getFieldsDefinition();
  }

  // Scan all products to detect which legacy field names are present
  const detectedLegacyFields = new Set<string>();
  const detectedFieldValues = new Map<string, any[]>();

  for (const product of products) {
    if (!product || typeof product !== 'object') continue;

    for (const [key, value] of Object.entries(product)) {
      // Skip known metadata fields
      if (['id', 'name', 'category', 'image', 'imagePath', 'imageFilename', 'imageBase64', 'imageData', 'renderedImages'].includes(key)) {
        continue;
      }

      // Check if this key matches any legacy field definition
      for (const fieldConfig of DEFAULT_FIELDS) {
        if (fieldConfig.legacyKeys?.some(lk => lk.toLowerCase() === key.toLowerCase())) {
          detectedLegacyFields.add(fieldConfig.key);
          if (!detectedFieldValues.has(fieldConfig.key)) {
            detectedFieldValues.set(fieldConfig.key, []);
          }
          if (value !== null && value !== undefined && value !== '') {
            detectedFieldValues.get(fieldConfig.key)!.push(value);
          }
          break;
        }
      }

      // Also check for new field format (field1, field2, price1, price2, etc.)
      if (/^(field|price)\d+$/.test(key)) {
        detectedLegacyFields.add(key);
        if (!detectedFieldValues.has(key)) {
          detectedFieldValues.set(key, []);
        }
        if (value !== null && value !== undefined && value !== '') {
          detectedFieldValues.get(key)!.push(value);
        }
      }
    }
  }

  console.log('🔍 Detected legacy fields in backup:', Array.from(detectedLegacyFields));

  // Get current field definition
  let definition = getFieldsDefinition();

  // Update field definitions: enable fields that are detected in the backup
  const updatedFields = definition.fields.map(fieldConfig => {
    // Check if this field was detected in the backup
    const isDetected = detectedLegacyFields.has(fieldConfig.key);
    const hasValues = detectedFieldValues.has(fieldConfig.key) && detectedFieldValues.get(fieldConfig.key)!.length > 0;

    if (isDetected && hasValues) {
      console.log(`✅ Enabling field: ${fieldConfig.key} (${fieldConfig.label}) - detected ${detectedFieldValues.get(fieldConfig.key)!.length} products with values`);
      return {
        ...fieldConfig,
        enabled: true, // Enable the field since we found data for it
      };
    } else if (fieldConfig.enabled) {
      // Keep existing enabled state
      return fieldConfig;
    }

    return fieldConfig;
  });

  // Create updated definition
  const updatedDefinition: FieldsDefinition = {
    version: 1,
    fields: updatedFields,
    industry: definition.industry || 'Restored from Backup',
    lastUpdated: Date.now(),
  };

  console.log('📋 Updated field definition with detected fields');
  console.log('   Enabled fields:', updatedDefinition.fields.filter(f => f.enabled).map(f => `${f.key}(${f.label})`).join(', '));

  return updatedDefinition;
}

/**
 * Analyze backup and apply field configuration intelligently
 * This should be called during backup restore
 */
export function applyBackupFieldAnalysis(products: any[]): void {
  try {
    console.log('🔎 Analyzing backup fields...');
    const updatedDefinition = analyzeBackupFieldsAndUpdateDefinition(products);
    setFieldsDefinition(updatedDefinition);
    console.log('✅ Backup field analysis complete - field definitions updated');
  } catch (err) {
    console.error('❌ Error analyzing backup fields:', err);
    // Don't throw - continue with current field definition
  }
}
