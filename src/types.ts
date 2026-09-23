/**
 * Type definitions for Agent Manifest Protocol v0.3 (CLI scaffold and helpers).
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

export interface AgentManifest {
  spec_version: 'agentmanifest-0.3';
  name: string;
  version: string;
  description: string;
  homepage?: string;
  documentation?: string;
  categories: string[];
  primary_category:
    | 'reference'
    | 'live'
    | 'computational'
    | 'transactional'
    | 'enrichment'
    | 'personal'
    | 'discovery';
  endpoints: Endpoint[];
  pricing: {
    model: string;
    free_tier?: { queries_per_day?: number | null; queries_per_month?: number | null } | null;
    paid_tier?: Record<string, unknown> | null;
    support_url?: string | null;
  };
  payment?: null | Record<string, unknown>;
  authentication: {
    required: boolean;
    type: 'api_key' | 'oauth2' | 'bearer' | 'none' | null;
    instructions?: string | null;
  };
  reliability?: Record<string, unknown>;
  rate_limits?: Record<string, unknown>;
  agent_notes: string;
  contact: string;
  listing_requested: boolean;
  last_updated: string;
}
