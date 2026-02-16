/**
 * Type definitions for Agent Manifest Protocol v0.1
 */

export interface Parameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  enum?: any[];
}

export interface ResponseSchema {
  type: string;
  description: string;
  properties?: Record<string, any>;
}

export interface EndpointExample {
  request: string;
  response: any;
  description?: string;
}

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: {
    query?: Record<string, Parameter>;
    body?: Record<string, Parameter>;
    path?: Record<string, Parameter>;
  };
  response: ResponseSchema;
  examples?: EndpointExample[];
}

export interface PricingDetails {
  free_tier?: string;
  rates?: {
    per_request?: number;
    per_month?: number;
    currency?: string;
  };
  billing_period?: string;
}

export interface Pricing {
  model: 'free' | 'usage_based' | 'subscription';
  details?: string | PricingDetails;
}

export interface AuthenticationConfig {
  header?: string;
  signup_url?: string;
  oauth_flow?: string;
  token_url?: string;
  scopes?: string[];
}

export interface Authentication {
  type: 'none' | 'api_key' | 'oauth2' | 'bearer';
  config?: AuthenticationConfig;
}

export interface RateLimits {
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
}

export interface ReliabilityMetrics {
  uptime_percentage?: number;
  avg_response_time_ms?: number;
  last_30_days_uptime?: number;
  maintained_by?: string;
}

export interface Contact {
  email?: string;
  support_url?: string;
  github?: string;
  twitter?: string;
}

export interface AgentManifest {
  spec_version: 'agentmanifest-0.1';
  name: string;
  version: string;
  description: string;
  homepage?: string;
  documentation?: string;
  categories: string[];
  primary_category: string;
  endpoints: Endpoint[];
  pricing: Pricing;
  authentication: Authentication;
  rate_limits?: RateLimits;
  reliability_metrics?: ReliabilityMetrics;
  contact?: Contact;
  agent_notes: string;
  listing_requested?: boolean;
  last_updated: string;
}
