import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import inquirer from 'inquirer';
import { validateManifestObject } from '@agentmanifest/validator';

const REGISTRY_URL = 'https://api.agent-manifest.com/listings/submit';
const ISSUE_FORM_URL =
  'https://github.com/AMProtocol/registry/issues/new?template=add-api.yml';

interface PublishOptions {
  file?: string;
  pr?: boolean;
}

interface PublishResult {
  data?: {
    submission_id: string;
    status: string;
    status_url: string;
    message: string;
  };
}

interface StatusResult {
  status: 'pending' | 'validating' | 'approved' | 'rejected' | 'completed';
  listing_id?: string;
  listing_url?: string;
  validation_errors?: Array<{ field: string; message: string }>;
  message?: string;
}

export async function publishCommand(options: PublishOptions) {
  const filePath = path.resolve(process.cwd(), options.file || './agent-manifest.json');

  console.log(chalk.cyan.bold('\n📤 Publishing Agent Manifest\n'));
  console.log(chalk.gray(`File: ${filePath}\n`));

  if (options.pr) {
    console.log(chalk.cyan('Opening the registry issue form for a PR-based submission:\n'));
    console.log(chalk.gray(ISSUE_FORM_URL));
    console.log(
      chalk.gray(
        '\nPaste your API URL or manifest link in the issue. A GitHub Action will validate and open a PR.\n'
      )
    );
    return;
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const manifest = JSON.parse(fileContent);

    if (!manifest.homepage) {
      const { homepage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'homepage',
          message: 'Enter your API base URL (where /.well-known/agent-manifest.json is hosted):',
          validate: (input: string) => {
            if (!input) return 'Homepage URL is required';
            try {
              new URL(input);
              return input.startsWith('https://') || 'Must be HTTPS URL';
            } catch {
              return 'Must be a valid URL';
            }
          },
        },
      ]);
      manifest.homepage = homepage;
      await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
    }

    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'amp-cli-local-validation-only';
    }

    console.log(chalk.gray('Step 1/2: Validating manifest...'));
    const validation = await validateManifestObject(manifest, manifest.homepage);
    if (!validation.passed) {
      console.log(chalk.red.bold('❌ Validation Failed'));
      validation.checks
        .filter((c) => !c.passed && c.severity === 'error')
        .forEach((c, i) => console.log(chalk.red(`  ${i + 1}. ${c.name}: ${c.message}`)));
      process.exit(1);
    }
    console.log(chalk.green('✓ Validation passed'));

    console.log(chalk.gray('Step 2/2: Submitting to registry...'));
    const publishResponse = await axios.post<PublishResult>(
      REGISTRY_URL,
      { url: manifest.homepage, manifest },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const result = publishResponse.data;
    if (!result.data?.submission_id) {
      console.log(chalk.red('❌ Unexpected response from registry'));
      console.log(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    const submissionId = result.data.submission_id;
    const baseUrl = REGISTRY_URL.replace('/listings/submit', '');
    const fullStatusUrl = `${baseUrl}${result.data.status_url}`;

    console.log(chalk.green('✓ Submission accepted'));
    console.log(chalk.gray(`Submission ID: ${submissionId}`));

    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const statusResponse = await axios.get<StatusResult>(fullStatusUrl, { timeout: 5000 });
        const status = statusResponse.data;
        if (status.status === 'approved' || status.status === 'completed') {
          console.log(chalk.green.bold('\n✅ Successfully Published!'));
          if (status.listing_id) console.log(chalk.gray(`Listing ID: ${status.listing_id}`));
          if (status.listing_url) {
            const url = status.listing_url.startsWith('http')
              ? status.listing_url
              : `https://api.agent-manifest.com${status.listing_url}`;
            console.log(chalk.gray(`View at: ${url}`));
          }
          process.exit(0);
        }
        if (status.status === 'rejected') {
          console.log(chalk.red.bold('\n❌ Publication Rejected'));
          if (status.message) console.log(chalk.red(status.message));
          process.exit(1);
        }
      } catch {
        /* retry */
      }
    }

    console.log(chalk.yellow('\n⏱️  Validation timeout — check status manually:'));
    console.log(chalk.cyan(fullStatusUrl));
    process.exit(1);
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string; response?: { data?: { message?: string } } };
    console.error(chalk.red(`❌ ${e.response?.data?.message ?? e.message ?? error}`));
    process.exit(1);
  }
}
