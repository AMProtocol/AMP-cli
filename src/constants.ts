/**
 * Standard categories defined in AMP specification v0.2
 */
export const STANDARD_CATEGORIES = [
  'food-science',
  'materials',
  'construction',
  'music-gear',
  'chemistry',
  'biology',
  'geography',
  'finance',
  'legal',
  'medical',
  'engineering',
  'agriculture',
  'computing',
  'language',
  'history',
  'commerce',
  'identity',
  'weather',
  'logistics',
  'other',
] as const;

/**
 * Primary categories defined in AMP specification v0.2
 */
export const PRIMARY_CATEGORIES = [
  { name: 'Reference - Static or cached data', value: 'reference' },
  { name: 'Live - Real-time data', value: 'live' },
  { name: 'Computational - Processing or computation', value: 'computational' },
  { name: 'Transactional - Actions or transactions', value: 'transactional' },
  { name: 'Enrichment - Data augmentation', value: 'enrichment' },
  { name: 'Personal - User-specific data', value: 'personal' },
  { name: 'Discovery - Search or discovery', value: 'discovery' },
] as const;

/**
 * Pricing models defined in AMP specification v0.2
 */
export const PRICING_MODELS = [
  { name: 'Free - No cost to use', value: 'free' },
  { name: 'Per Query - Pay per request', value: 'per-query' },
  { name: 'Subscription - Fixed recurring fee', value: 'subscription' },
  { name: 'Pay What You Want - Voluntary contributions', value: 'pay-what-you-want' },
  { name: 'Tiered - Multiple pricing tiers', value: 'tiered' },
] as const;

/**
 * Authentication types defined in AMP specification v0.2
 */
export const AUTH_TYPES = [
  { name: 'None - No authentication required', value: 'none' },
  { name: 'API Key - Simple key-based auth', value: 'api_key' },
  { name: 'OAuth2 - OAuth 2.0 flow', value: 'oauth2' },
  { name: 'Bearer Token - Bearer token auth', value: 'bearer' },
] as const;

/**
 * Reliability maintained_by values defined in AMP specification v0.2
 */
export const MAINTAINED_BY = [
  { name: 'Individual', value: 'individual' },
  { name: 'Organization', value: 'organization' },
  { name: 'Community', value: 'community' },
] as const;
