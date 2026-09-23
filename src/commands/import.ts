import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import chalk from 'chalk';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yaml';
const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

export interface ImportOverrides {
  id?: string;
  name?: string;
  description?: string;
  categories?: string[];
  primary_category?: string;
  pricing?: { model?: string };
  agent_notes?: string;
  representative_queries?: string[];
  endpoint_allowlist?: string[];
  contact?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function mapAuth(securitySchemes: Record<string, unknown> | undefined): {
  required: boolean;
  type: 'api_key' | 'oauth2' | 'bearer' | 'none' | null;
  instructions: string | null;
} {
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return { required: false, type: 'none', instructions: null };
  }
  const first = Object.values(securitySchemes)[0] as { type?: string; in?: string; name?: string };
  if (first?.type === 'apiKey') {
    return {
      required: true,
      type: 'api_key',
      instructions: `Send the API key in the ${first.in ?? 'header'} as ${first.name ?? 'X-API-Key'}.`,
    };
  }
  if (first?.type === 'oauth2') {
    return { required: true, type: 'oauth2', instructions: 'Obtain an OAuth2 access token per the provider docs.' };
  }
  if (first?.type === 'http') {
    return { required: true, type: 'bearer', instructions: 'Send Authorization: Bearer <token>.' };
  }
  return { required: true, type: 'api_key', instructions: 'Authentication required; see OpenAPI securitySchemes.' };
}

function baseUrlFromSpec(api: Record<string, unknown>): string {
  const servers = api.servers as Array<{ url: string }> | undefined;
  if (servers?.[0]?.url) return servers[0].url.replace(/\/$/, '');
  const host = api.host as string | undefined;
  const basePath = (api.basePath as string) || '';
  const schemes = (api.schemes as string[]) || ['https'];
  if (host) return `${schemes[0]}://${host}${basePath}`.replace(/\/$/, '');
  throw new Error('Could not determine base URL from OpenAPI spec (no servers or host)');
}

async function parseOpenApiSpec(specInput: string | Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof specInput !== 'string') {
    return (await SwaggerParser.dereference(specInput as object)) as Record<string, unknown>;
  }
  const trimmed = specInput.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('---')) {
    const doc = trimmed.startsWith('{') ? JSON.parse(specInput) : YAML.parse(specInput);
    return (await SwaggerParser.dereference(doc as object)) as Record<string, unknown>;
  }
  return (await SwaggerParser.parse(specInput)) as Record<string, unknown>;
}

export async function buildRecordFromOpenAPI(
  specInput: string | Record<string, unknown>,
  overrides: ImportOverrides = {},
  sourceUrl?: string
): Promise<Record<string, unknown>> {
  const api = await parseOpenApiSpec(specInput);

  const info = api.info as { title?: string; version?: string; description?: string };
  const baseUrl = baseUrlFromSpec(api);
  const domain = new URL(baseUrl).hostname;
  const id = overrides.id ?? slugify(info.title ?? domain);

  const paths = (api.paths ?? {}) as Record<string, Record<string, unknown>>;
  const allowlist = new Set(overrides.endpoint_allowlist ?? []);
  const endpoints: Array<Record<string, unknown>> = [];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const method of METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const opId = (op as { operationId?: string }).operationId ?? `${method}${pathKey}`;
      if (allowlist.size > 0 && !allowlist.has(opId) && !allowlist.has(pathKey)) continue;
      if (endpoints.length >= 25) break;
      const summary = (op as { summary?: string; description?: string }).summary
        ?? (op as { description?: string }).description
        ?? `${method.toUpperCase()} ${pathKey}`;
      endpoints.push({
        path: pathKey,
        method: method.toUpperCase(),
        description: summary.length >= 20 ? summary : `${summary}. See OpenAPI docs for usage.`,
        parameters: [],
        response_description: 'Response per the OpenAPI specification for this operation.',
      });
    }
    if (endpoints.length >= 25) break;
  }

  if (endpoints.length === 0) {
    endpoints.push({
      path: '/',
      method: 'GET',
      description: 'Root endpoint; see OpenAPI documentation for available operations.',
      parameters: [],
      response_description: 'API root or health response.',
    });
  }

  const desc =
    overrides.description ??
    info.description ??
    `${info.title ?? domain} API imported from public OpenAPI documentation.`;

  const manifest = {
    spec_version: 'agentmanifest-0.3',
    name: overrides.name ?? info.title ?? domain,
    version: info.version ?? '1.0.0',
    description: desc.length >= 100 ? desc : `${desc} `.padEnd(100, '.'),
    homepage: baseUrl,
    categories: overrides.categories ?? ['other'],
    primary_category: overrides.primary_category ?? 'reference',
    endpoints,
    pricing: { model: overrides.pricing?.model ?? 'unknown', free_tier: null, paid_tier: null },
    payment: null,
    authentication: mapAuth(api.components as { securitySchemes?: Record<string, unknown> } | undefined
      ? (api.components as { securitySchemes?: Record<string, unknown> }).securitySchemes
      : (api.securityDefinitions as Record<string, unknown> | undefined)),
    agent_notes:
      overrides.agent_notes ??
      `Auto-generated from public OpenAPI docs at ${typeof specInput === 'string' ? specInput : baseUrl}. Not endorsed by ${domain}. Verify pricing and authentication before production use.`,
    contact: overrides.contact ?? `https://${domain}`,
    listing_requested: false,
    last_updated: new Date().toISOString(),
  };

  const specUrl =
    sourceUrl ??
    (typeof specInput === 'string' && specInput.trim().startsWith('http') ? specInput : baseUrl);
  const retrievedAt = new Date().toISOString();
  const sha256 = createHash('sha256')
    .update(typeof specInput === 'string' ? specInput : JSON.stringify(specInput))
    .digest('hex');

  return {
    id,
    legacy_id: null,
    status: 'unverified',
    submitted_via: 'import',
    url: baseUrl,
    manifest_url: null,
    publisher: { domain, group: slugify(domain.split('.').slice(-2).join('-')) },
    source: { type: 'openapi', url: specUrl, retrieved_at: retrievedAt, sha256 },
    representative_queries: overrides.representative_queries ?? [],
    badges: [],
    created_at: retrievedAt,
    verified_at: null,
    last_checked_at: retrievedAt,
    consecutive_failures: 0,
    last_valid: null,
    current_errors: [],
    manifest,
  };
}

export async function importOpenApiCommand(
  source: string,
  options: { overrides?: string; out?: string }
) {
  console.log(chalk.cyan.bold('\n📥 Import OpenAPI → registry record\n'));

  let specInput: string;
  let sourceUrl: string | undefined;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    sourceUrl = source;
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
    specInput = await res.text();
  } else {
    sourceUrl = path.resolve(source);
    specInput = await fs.readFile(sourceUrl, 'utf-8');
  }

  let overrides: ImportOverrides = {};
  if (options.overrides) {
    const raw = await fs.readFile(path.resolve(options.overrides), 'utf-8');
    overrides = YAML.parse(raw) as ImportOverrides;
  }

  const record = await buildRecordFromOpenAPI(specInput, overrides, sourceUrl);
  const outPath = options.out
    ? path.resolve(options.out)
    : path.join(process.cwd(), `${record.id}.registry.json`);

  await fs.writeFile(outPath, JSON.stringify(record, null, 2));
  console.log(chalk.green(`✅ Wrote registry record to ${outPath}`));
  console.log(chalk.gray(`Status: unverified | ID: ${record.id}`));
}
