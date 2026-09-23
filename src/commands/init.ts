import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { AgentManifest } from '../types';

/** Minimal valid manifest per agentmanifest-0.3 spec. */
function scaffoldManifest(): AgentManifest {
  return {
    spec_version: 'agentmanifest-0.3',
    name: 'My API',
    version: '1.0.0',
    description:
      'Describe your API here. Minimum 100 characters required. Explain what data or capabilities this API provides for AI agents and how they should use it.',
    categories: ['other'],
    primary_category: 'reference',
    endpoints: [
      {
        path: '/example',
        method: 'GET',
        description: 'Describe when and why agents should use this endpoint (min 20 chars)',
        parameters: [],
        response_description: 'Describe the response content and how to interpret it (min 20 chars)',
      },
    ],
    pricing: {
      model: 'free',
      free_tier: { queries_per_day: null, queries_per_month: null },
      paid_tier: null,
    },
    payment: null,
    authentication: { required: false, type: 'none' },
    agent_notes:
      'Add implementation guidance for AI agents here. Minimum 150 characters for v0.3. Describe account setup, authentication, pricing, and how to make requests. Mention payment or onboarding if your API charges per call.',
    contact: 'you@example.com',
    listing_requested: false,
    last_updated: new Date().toISOString(),
  };
}

export async function initCommand() {
  const outputPath = path.join(process.cwd(), 'agent-manifest.json');

  try {
    await fs.access(outputPath);
    try {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'agent-manifest.json already exists. Overwrite?',
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log(chalk.yellow('\nAborted.\n'));
        return;
      }
    } catch (err: unknown) {
      const e = err as { isTtyError?: boolean };
      if (e.isTtyError) {
        console.error(
          chalk.red(
            '\nagent-manifest.json exists. Run in an interactive terminal to overwrite, or remove the file first.\n'
          )
        );
        process.exit(1);
      }
      throw err;
    }
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code !== 'ENOENT') throw err;
  }

  const manifest = scaffoldManifest();
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(chalk.green.bold('\n✅ Created agent-manifest.json (v0.3)'));
  console.log(chalk.gray('\nEdit the file, then run "amp validate".\n'));
}
