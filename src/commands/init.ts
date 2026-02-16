import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { STANDARD_CATEGORIES, PRICING_MODELS, AUTH_TYPES } from '../constants';
import type { AgentManifest, Endpoint, Parameter } from '../types';

export async function initCommand() {
  console.log(chalk.cyan.bold('\n🚀 Agent Manifest Protocol - Interactive Setup\n'));
  console.log(chalk.gray('This wizard will help you create a valid agent-manifest.json file.\n'));

  try {
    // Check if file already exists
    const outputPath = path.join(process.cwd(), 'agent-manifest.json');
    try {
      await fs.access(outputPath);
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'agent-manifest.json already exists. Overwrite?',
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log(chalk.yellow('Aborted.'));
        return;
      }
    } catch {
      // File doesn't exist, continue
    }

    // Basic Information
    console.log(chalk.bold('\n📋 Basic Information'));
    const basicInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'API name:',
        validate: (input) => input.trim().length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version (semantic versioning):',
        default: '1.0.0',
        validate: (input) => {
          const semverRegex = /^\d+\.\d+\.\d+$/;
          return semverRegex.test(input) || 'Must be valid semantic version (e.g., 1.0.0)';
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (min 100 characters):',
        validate: (input) =>
          input.trim().length >= 100 || `Description must be at least 100 characters (currently ${input.trim().length})`,
      },
      {
        type: 'input',
        name: 'homepage',
        message: 'Homepage URL (optional):',
        validate: (input) => {
          if (!input) return true;
          try {
            new URL(input);
            return input.startsWith('https://') || 'Must be HTTPS URL';
          } catch {
            return 'Must be a valid URL';
          }
        },
      },
      {
        type: 'input',
        name: 'documentation',
        message: 'Documentation URL (optional):',
        validate: (input) => {
          if (!input) return true;
          try {
            new URL(input);
            return input.startsWith('https://') || 'Must be HTTPS URL';
          } catch {
            return 'Must be a valid URL';
          }
        },
      },
    ]);

    // Categories
    console.log(chalk.bold('\n🏷️  Categories'));
    const categoryInfo = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'categories',
        message: 'Select categories (must select at least one):',
        choices: STANDARD_CATEGORIES,
        validate: (input) => input.length > 0 || 'Must select at least one category',
      },
    ]);

    const { primary_category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'primary_category',
        message: 'Select primary category:',
        choices: categoryInfo.categories,
      },
    ]);

    // Endpoints
    console.log(chalk.bold('\n🔌 Endpoints'));
    const endpoints: Endpoint[] = [];
    let addMore = true;

    while (addMore) {
      const endpointInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'path',
          message: 'Endpoint path (e.g., /api/v1/data):',
          validate: (input) => input.trim().startsWith('/') || 'Path must start with /',
        },
        {
          type: 'list',
          name: 'method',
          message: 'HTTP method:',
          choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Endpoint description:',
          validate: (input) => input.trim().length > 0 || 'Description is required',
        },
        {
          type: 'input',
          name: 'response_description',
          message: 'Response description:',
          validate: (input) => input.trim().length > 0 || 'Response description is required',
        },
      ]);

      // Ask about parameters
      const { hasParams } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'hasParams',
          message: 'Add parameters to this endpoint?',
          default: false,
        },
      ]);

      const parameters: { query?: Record<string, Parameter>; body?: Record<string, Parameter> } = {};

      if (hasParams) {
        const { paramLocation } = await inquirer.prompt([
          {
            type: 'list',
            name: 'paramLocation',
            message: 'Parameter location:',
            choices: ['query', 'body'],
          },
        ]);

        const params: Record<string, Parameter> = {};
        let addMoreParams = true;

        while (addMoreParams) {
          const paramInfo = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Parameter name:',
              validate: (input) => input.trim().length > 0 || 'Name is required',
            },
            {
              type: 'list',
              name: 'type',
              message: 'Parameter type:',
              choices: ['string', 'number', 'boolean', 'array', 'object'],
            },
            {
              type: 'confirm',
              name: 'required',
              message: 'Is this parameter required?',
              default: false,
            },
            {
              type: 'input',
              name: 'description',
              message: 'Parameter description:',
              validate: (input) => input.trim().length > 0 || 'Description is required',
            },
          ]);

          params[paramInfo.name] = {
            type: paramInfo.type,
            required: paramInfo.required,
            description: paramInfo.description,
          };

          const { continueParams } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'continueParams',
              message: 'Add another parameter?',
              default: false,
            },
          ]);

          addMoreParams = continueParams;
        }

        parameters[paramLocation as 'query' | 'body'] = params;
      }

      endpoints.push({
        path: endpointInfo.path,
        method: endpointInfo.method,
        description: endpointInfo.description,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        response: {
          type: 'object',
          description: endpointInfo.response_description,
        },
      });

      const { continueEndpoints } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueEndpoints',
          message: 'Add another endpoint?',
          default: false,
        },
      ]);

      addMore = continueEndpoints;
    }

    // Pricing
    console.log(chalk.bold('\n💰 Pricing'));
    const pricingInfo = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Pricing model:',
        choices: PRICING_MODELS,
      },
      {
        type: 'input',
        name: 'details',
        message: 'Pricing details (optional, e.g., "First 1000 requests free"):',
      },
    ]);

    // Authentication
    console.log(chalk.bold('\n🔐 Authentication'));
    const authInfo = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Authentication type:',
        choices: AUTH_TYPES,
      },
    ]);

    let authConfig: any = {};
    if (authInfo.type !== 'none') {
      const configInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'header',
          message: 'Header name (e.g., X-API-Key, Authorization):',
          when: authInfo.type === 'api_key' || authInfo.type === 'bearer',
        },
        {
          type: 'input',
          name: 'signup_url',
          message: 'Signup URL for obtaining credentials:',
          validate: (input) => {
            if (!input) return true;
            try {
              new URL(input);
              return true;
            } catch {
              return 'Must be a valid URL';
            }
          },
        },
      ]);
      authConfig = configInfo;
    }

    // Rate Limits (optional)
    console.log(chalk.bold('\n⏱️  Rate Limits (optional)'));
    const { addRateLimits } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addRateLimits',
        message: 'Add rate limit information?',
        default: false,
      },
    ]);

    let rateLimits;
    if (addRateLimits) {
      rateLimits = await inquirer.prompt([
        {
          type: 'number',
          name: 'requests_per_minute',
          message: 'Requests per minute:',
          default: 60,
        },
        {
          type: 'number',
          name: 'requests_per_day',
          message: 'Requests per day:',
          default: 10000,
        },
      ]);
    }

    // Reliability Metrics (optional)
    console.log(chalk.bold('\n📊 Reliability Metrics (optional)'));
    const { addReliability } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addReliability',
        message: 'Add reliability metrics?',
        default: false,
      },
    ]);

    let reliabilityMetrics;
    if (addReliability) {
      reliabilityMetrics = await inquirer.prompt([
        {
          type: 'number',
          name: 'uptime_percentage',
          message: 'Uptime percentage (e.g., 99.9):',
          default: 99.9,
          validate: (input) => (input >= 0 && input <= 100) || 'Must be between 0 and 100',
        },
        {
          type: 'number',
          name: 'avg_response_time_ms',
          message: 'Average response time (ms):',
          default: 150,
        },
      ]);
    }

    // Contact Information
    console.log(chalk.bold('\n📧 Contact Information'));
    const contactInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Support email:',
        validate: (input) => {
          if (!input) return true;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Must be a valid email';
        },
      },
      {
        type: 'input',
        name: 'support_url',
        message: 'Support URL (optional):',
        validate: (input) => {
          if (!input) return true;
          try {
            new URL(input);
            return true;
          } catch {
            return 'Must be a valid URL';
          }
        },
      },
      {
        type: 'input',
        name: 'github',
        message: 'GitHub URL (optional):',
        validate: (input) => {
          if (!input) return true;
          try {
            new URL(input);
            return input.includes('github.com') || 'Should be a GitHub URL';
          } catch {
            return 'Must be a valid URL';
          }
        },
      },
    ]);

    // Agent Notes
    console.log(chalk.bold('\n🤖 Agent Guidance'));
    const { agent_notes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'agent_notes',
        message: 'Implementation guidance for AI agents (min 50 characters):',
        validate: (input) =>
          input.trim().length >= 50 ||
          `Agent notes must be at least 50 characters (currently ${input.trim().length})`,
      },
    ]);

    // Registry Listing
    console.log(chalk.bold('\n📝 Registry'));
    const { listing_requested } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'listing_requested',
        message: 'Request listing in public AMP registry?',
        default: true,
      },
    ]);

    // Build the manifest
    const manifest: AgentManifest = {
      spec_version: 'agentmanifest-0.1',
      name: basicInfo.name,
      version: basicInfo.version,
      description: basicInfo.description,
      ...(basicInfo.homepage && { homepage: basicInfo.homepage }),
      ...(basicInfo.documentation && { documentation: basicInfo.documentation }),
      categories: categoryInfo.categories,
      primary_category,
      endpoints,
      pricing: {
        model: pricingInfo.model,
        ...(pricingInfo.details && { details: pricingInfo.details }),
      },
      authentication: {
        type: authInfo.type,
        ...(authInfo.type !== 'none' && Object.keys(authConfig).length > 0 && { config: authConfig }),
      },
      ...(rateLimits && { rate_limits: rateLimits }),
      ...(reliabilityMetrics && { reliability_metrics: reliabilityMetrics }),
      ...(Object.keys(contactInfo).some((k) => contactInfo[k as keyof typeof contactInfo]) && {
        contact: Object.fromEntries(
          Object.entries(contactInfo).filter(([_, v]) => v)
        ),
      }),
      agent_notes,
      listing_requested,
      last_updated: new Date().toISOString(),
    };

    // Write to file
    await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));

    console.log(chalk.green.bold('\n✅ Success!'));
    console.log(chalk.gray(`\nManifest created at: ${outputPath}`));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.cyan('  1. Review the generated manifest'));
    console.log(chalk.cyan('  2. Run "amp validate" to check compliance'));
    console.log(chalk.cyan('  3. Run "amp publish" to submit to registry'));
  } catch (error: any) {
    if (error.isTtyError) {
      console.error(chalk.red('Prompt could not be rendered in the current environment'));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(1);
  }
}
