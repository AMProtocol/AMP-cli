/**
 * Standard categories defined in AMP specification v0.1
 */
export const STANDARD_CATEGORIES = [
  'chemistry',
  'biology',
  'physics',
  'mathematics',
  'finance',
  'weather',
  'geography',
  'food_science',
  'engineering',
  'legal',
  'medical',
  'education',
  'translation',
  'media',
  'general',
] as const;

/**
 * Pricing models defined in AMP specification v0.1
 */
export const PRICING_MODELS = [
  { name: 'Free - No cost to use', value: 'free' },
  { name: 'Usage Based - Pay per request', value: 'usage_based' },
  { name: 'Subscription - Fixed recurring fee', value: 'subscription' },
] as const;

/**
 * Authentication types defined in AMP specification v0.1
 */
export const AUTH_TYPES = [
  { name: 'None - No authentication required', value: 'none' },
  { name: 'API Key - Simple key-based auth', value: 'api_key' },
  { name: 'OAuth2 - OAuth 2.0 flow', value: 'oauth2' },
  { name: 'Bearer Token - Bearer token auth', value: 'bearer' },
] as const;
