import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

const API = process.env.AMP_REGISTRY_API ?? 'https://api.agent-manifest.com';

interface ListingRow {
  id: string;
  name: string;
  url: string;
  description: string;
  primary_category?: string;
}

interface IndexEntry {
  id: string;
  name: string;
  url?: string;
  representative_queries?: string[];
  manifest?: { homepage?: string; endpoints?: Array<{ path: string; method: string }> };
}

function scoreQuery(question: string, entry: IndexEntry): number {
  const q = question.toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  let score = 0;
  const hay = [
    entry.name,
    ...(entry.representative_queries ?? []),
    entry.manifest?.homepage ?? '',
  ]
    .join(' ')
    .toLowerCase();
  for (const t of terms) {
    if (hay.includes(t)) score += 1;
  }
  for (const rq of entry.representative_queries ?? []) {
    if (q.includes(rq.toLowerCase()) || rq.toLowerCase().includes(q)) score += 3;
  }
  return score;
}

async function loadIndex(localPath?: string): Promise<IndexEntry[]> {
  if (localPath) {
    const raw = JSON.parse(await fs.readFile(path.resolve(localPath), 'utf-8'));
    return raw.entries ?? raw.listings ?? raw;
  }
  try {
    const res = await axios.get(`${API}/listings?limit=500`, { timeout: 15000 });
    const listings: ListingRow[] = res.data?.data?.listings ?? [];
    return listings.map((l) => ({
      id: l.id,
      name: l.name,
      url: l.url,
      representative_queries: [],
      manifest: { homepage: l.url },
    }));
  } catch {
    const fallback = path.join(process.cwd(), 'registry/index.json');
    const raw = JSON.parse(await fs.readFile(fallback, 'utf-8'));
    return raw.entries ?? [];
  }
}

export async function findCommand(question: string, options: { index?: string }) {
  console.log(chalk.cyan.bold(`\n🔎 Finding APIs for: "${question}"\n`));

  const entries = await loadIndex(options.index);
  const ranked = entries
    .map((e) => ({ entry: e, score: scoreQuery(question, e) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (ranked.length === 0) {
    console.log(chalk.yellow('No strong matches. Try browsing https://api.agent-manifest.com/listings'));
    return;
  }

  const best = ranked[0].entry;
  const base = best.url ?? best.manifest?.homepage ?? '';
  const endpoint = best.manifest?.endpoints?.[0];

  console.log(chalk.green.bold(`Best match: ${best.name}`));
  console.log(chalk.gray(`ID: ${best.id}`));
  if (best.representative_queries?.length) {
    console.log(chalk.gray(`Queries: ${best.representative_queries.join('; ')}`));
  }
  if (base) {
    console.log(chalk.cyan(`\nManifest: ${new URL('/.well-known/agent-manifest.json', base).toString()}`));
  }
  if (endpoint && base) {
    const url = new URL(endpoint.path, base).toString();
    console.log(chalk.cyan(`\nExample request:\n  curl "${url}"`));
  }
  console.log();
}
