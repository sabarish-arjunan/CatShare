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
  legacyKeys?: string[]; // Old field names for backward compatibility (e.g., ['color', 'colour'])
  unitField?: string; // Associated unit field (e.g., 'field2Unit' for packaging)
  unitOptions?: string[]; // Available units for this field
  defaultUnit?: string; // Default unit
}

export interface FieldsDefinition {
  version: number; // Version of field definition
  fields: FieldConfig[];
  lastUpdated: number;
}

// Default field configuration
export const DEFAULT_FIELDS: FieldConfig[] = [
  {
    key: 'field1',
    label: 'Colour',
    type: 'text',
    legacyKeys: ['color', 'colour'],
  },
  {
    key: 'field2',
    label: 'Package',
    type: 'text',
    legacyKeys: ['package'],
    unitField: 'field2Unit',
    unitOptions: ['pcs / set', 'pcs / dozen', 'pcs / pack'],
    defaultUnit: 'pcs / set',
  },
  {
    key: 'field3',
    label: 'Age Group',
    type: 'text',
    legacyKeys: ['age'],
    unitField: 'field3Unit',
    unitOptions: ['months', 'years', 'Newborn'],
    defaultUnit: 'months',
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
    lastUpdated: Date.now(),
  };
  setFieldsDefinition(definition);
}
