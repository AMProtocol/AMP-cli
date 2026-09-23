import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { validateManifestObject } from '@agentmanifest/validator';

const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';

interface ValidateOptions {
  file?: string;
  remote?: boolean;
}

function printResult(result: Awaited<ReturnType<typeof validateManifestObject>>) {
  if (result.passed) {
    console.log(chalk.green.bold('✅ Validation Passed'));
    console.log(chalk.gray(`\nYour manifest is compliant with AMP specification ${result.spec_version}`));
  } else {
    console.log(chalk.red.bold('❌ Validation Failed'));
  }

  const failedChecks = result.checks.filter((c) => !c.passed && c.severity === 'error');
  if (failedChecks.length > 0) {
    console.log(chalk.red.bold('\nErrors:'));
    failedChecks.forEach((check, i) => {
      console.log(chalk.red(`  ${i + 1}. ${check.name}: ${check.message}`));
    });
  }

  const warnings = result.checks.filter((c) => !c.passed && c.severity === 'warning');
  if (warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
    warnings.forEach((check, i) => {
      console.log(chalk.yellow(`  ${i + 1}. ${check.name}: ${check.message}`));
    });
  }

  if (result.badges?.length) {
    console.log(chalk.cyan(`\nBadges: ${result.badges.join(', ')}`));
  }
}

export async function validateCommand(options: ValidateOptions) {
  const filePath = path.resolve(process.cwd(), options.file || './agent-manifest.json');

  console.log(chalk.cyan.bold('\n🔍 Validating Agent Manifest\n'));
  console.log(chalk.gray(`File: ${filePath}\n`));

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(fileContent);
    } catch {
      console.error(chalk.red('❌ Invalid JSON'));
      process.exit(1);
    }

    const homepage =
      typeof manifest.homepage === 'string' ? manifest.homepage : 'local-file';

    if (options.remote) {
      console.log(chalk.gray('Using remote validator API...'));
      const response = await axios.post(VALIDATOR_URL, { manifest, url: homepage }, { timeout: 30000 });
      printResult(response.data);
      process.exit(response.data.passed ? 0 : 1);
    }

    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'amp-cli-local-validation-only';
    }

    console.log(chalk.gray('Validating offline with @agentmanifest/validator...'));
    const result = await validateManifestObject(manifest, homepage);
    printResult(result);

    if (result.passed) {
      console.log(chalk.cyan('\nNext step: Run "amp publish" to submit to registry'));
    }
    process.exit(result.passed ? 0 : 1);
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string };
    if (e.code === 'ENOENT') {
      console.error(chalk.red('❌ File Not Found'));
      console.error(chalk.gray('\nRun "amp init" to create a new manifest.'));
    } else {
      console.error(chalk.red(`❌ ${e.message ?? error}`));
    }
    process.exit(1);
  }
}
