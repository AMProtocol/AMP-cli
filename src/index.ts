#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { publishCommand } from './commands/publish';

const program = new Command();

program
  .name('amp')
  .description('Agent Manifest Protocol (AMP) CLI - Create, validate, and publish API manifests')
  .version('0.1.0');

program
  .command('init')
  .description('Interactively create a new agent-manifest.json file')
  .action(initCommand);

program
  .command('validate')
  .description('Validate agent-manifest.json against AMP specification')
  .option('-f, --file <path>', 'Path to manifest file', './agent-manifest.json')
  .action(validateCommand);

program
  .command('publish')
  .description('Validate and publish agent-manifest.json to the AMP registry')
  .option('-f, --file <path>', 'Path to manifest file', './agent-manifest.json')
  .action(publishCommand);

program.parse();
