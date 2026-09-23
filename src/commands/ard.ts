import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface ArdEntry {
  identifier: string;
  type: string;
  url?: string;
  data?: unknown;
  representativeQueries?: string[];
}

export async function ardCommand(options: { file?: string; out?: string; queries?: string }) {
  const filePath = path.resolve(process.cwd(), options.file || './agent-manifest.json');
  const manifest = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  let domain: string;
  try {
    domain = new URL(manifest.homepage ?? 'https://example.com').hostname;
  } catch {
    domain = 'example.com';
  }

  const slug = manifest.name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') ?? 'api';

  const queries = options.queries
    ? options.queries.split(',').map((q) => q.trim()).filter(Boolean)
    : [];

  const entry: ArdEntry = {
    identifier: `urn:air:${domain}:api:${slug}`,
    type: 'application/agent-manifest+json',
    url: manifest.homepage
      ? new URL('/.well-known/agent-manifest.json', manifest.homepage).toString()
      : undefined,
    representativeQueries: queries.length ? queries : undefined,
  };

  const ard = {
    version: '0.91',
    entries: [entry],
  };

  const outDir = options.out
    ? path.dirname(path.resolve(options.out))
    : path.join(process.cwd(), '.well-known');
  const outFile = options.out
    ? path.resolve(options.out)
    : path.join(outDir, 'ard.json');

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(ard, null, 2));

  console.log(chalk.green.bold('\n✅ Wrote ARD catalog'));
  console.log(chalk.gray(`File: ${outFile}`));
  console.log(chalk.gray(`Identifier: ${entry.identifier}\n`));
}
