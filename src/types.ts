/**
 * Type definitions for Agent Manifest Protocol v0.2
 */

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: EndpointParameter[];
  response_description: string;
}

export interface FreeTier {
  queries_per_day?: number | null;
  queries_per_month?: number | null;
}

export interface PaidTier {
  amount_usd: number;
  unit: string;
  description: string;
}

export interface Pricing {
  model: 'free' | 'per-query' | 'subscription' | 'pay-what-you-want' | 'tiered';
  free_tier?: FreeTier | null;
  paid_tier?: PaidTier | null;
  support_url?: string | null;
}

export interface Payment {
  provider?: string;
  checkout_url: string;
  key_provisioning_url?: string;
  accepted_methods?: string[];
  prepay_required?: boolean;
}

export interface Authentication {
  required: boolean;
  type: 'api_key' | 'oauth2' | 'bearer' | 'none' | null;
  instructions?: string | null;
}

export interface Reliability {
  maintained_by: 'individual' | 'organization' | 'community';
  status_url?: string | null;
  expected_uptime_pct?: number | null;
}

export interface AgentManifest {
  spec_version: 'agentmanifest-0.2';
  name: string;
  version: string;
  description: string;
  categories: string[];
  primary_category: 'reference' | 'live' | 'computational' | 'transactional' | 'enrichment' | 'personal' | 'discovery';
  endpoints: Endpoint[];
  pricing: Pricing;
  authentication: Authentication;
  reliability: Reliability;
  agent_notes: string;
  contact: string;
  listing_requested: boolean;
  last_updated: string;
}
