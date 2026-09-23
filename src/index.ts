#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { publishCommand } from './commands/publish';
import { importOpenApiCommand } from './commands/import';
import { ardCommand } from './commands/ard';
import { findCommand } from './commands/find';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('amp')
  .description('Agent Manifest Protocol (AMP) CLI — create, validate, and publish API manifests')
  .version(packageJson.version);

program.command('init').description('Scaffold a valid agent-manifest.json (v0.3)').action(initCommand);

program
  .command('validate')
  .description('Validate agent-manifest.json (offline by default)')
  .option('-f, --file <path>', 'Path to manifest file', './agent-manifest.json')
  .option('--remote', 'Use the hosted validator API instead of offline validation')
  .action(validateCommand);

program
  .command('publish')
  .description('Validate and publish to the AMP registry')
  .option('-f, --file <path>', 'Path to manifest file', './agent-manifest.json')
  .option('--pr', 'Open the GitHub issue form for a PR-based submission')
  .action(publishCommand);

const importCmd = program.command('import').description('Import external specs into registry records');
importCmd
  .command('openapi <urlOrFile>')
  .description('Build a registry record from an OpenAPI spec')
  .option('-o, --overrides <path>', 'YAML overrides (pricing, queries, allowlist)')
  .option('--out <path>', 'Output path for the registry record JSON')
  .action(importOpenApiCommand);

program
  .command('ard')
  .description('Generate /.well-known/ard.json from agent-manifest.json')
  .option('-f, --file <path>', 'Manifest file', './agent-manifest.json')
  .option('--out <path>', 'Output path (default: .well-known/ard.json)')
  .option('--queries <list>', 'Comma-separated representative queries')
  .action(ardCommand);

program
  .command('find <question>')
  .description('Find APIs by natural-language question')
  .option('--index <path>', 'Local registry/index.json (falls back to live API)')
  .action(findCommand);

program.parse();
