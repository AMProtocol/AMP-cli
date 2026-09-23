import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildRecordFromOpenAPI } from './import';

const fixtures = join(__dirname, '../../fixtures');

describe('buildRecordFromOpenAPI', () => {
  it('imports a minimal Swagger 2.0 fixture', async () => {
    const spec = readFileSync(join(fixtures, 'swagger2-minimal.json'), 'utf-8');
    const record = await buildRecordFromOpenAPI(spec, {
      id: 'swapi-test',
      representative_queries: ['star wars starship speeds'],
      pricing: { model: 'free' },
    });
    expect(record.status).toBe('unverified');
    expect(record.id).toBe('swapi-test');
    expect((record.manifest as { spec_version: string }).spec_version).toBe('agentmanifest-0.3');
    expect(record.representative_queries).toEqual(['star wars starship speeds']);
  });

  it('respects endpoint allowlist', async () => {
    const spec = readFileSync(join(fixtures, 'swagger2-minimal.json'), 'utf-8');
    const record = await buildRecordFromOpenAPI(spec, {
      endpoint_allowlist: ['/people/{id}'],
    });
    const endpoints = (record.manifest as { endpoints: Array<{ path: string }> }).endpoints;
    expect(endpoints.every((e) => e.path === '/people/{id}')).toBe(true);
  });
});
