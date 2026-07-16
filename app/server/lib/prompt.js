// Shared extraction constants. The extraction *contract* now lives in
// extractionSchemas.js (per-document schemas + prompt builder); routes/generate.js
// makes one focused API call per uploaded document type and maps the resulting
// envelopes with lib/mapExtraction.js. This file keeps only the pieces both the
// route and the schema layer share.

export const DOC_TYPES = [
  { type: 'gis', title: 'Corporate Registration' },
  { type: 'ltr', title: 'Large Transaction Report' },
  { type: 'fs', title: 'Financial Spread', multiple: true },
  { type: 'cbr', title: 'Credit Bureau Report' },
];

export const MODEL_FALLBACKS = [
  'claude-sonnet-5',
  'claude-opus-4-8',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
];

// Re-exported for callers that want the per-document prompt without importing the
// schema module directly.
export { buildDocPrompt, DOC_SCHEMA_KEYS, EXTRACTION_SCHEMA } from './extractionSchemas.js';
