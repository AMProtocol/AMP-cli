import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { validateManifestRemote, type ValidationResult } from '../lib/remoteValidate';

interface ValidateOptions {
  file?: string;
}

function printResult(result: ValidationResult) {
  if (result.passed) {
    console.log(chalk.green.bold('✅ Validation Passed'));
    console.log(chalk.gray(`\nYour manifest is compliant with AMP specification ${result.spec_version}`));
  } else {
    console.log(chalk.red.bold('❌ Validation Failed'));
  }

  const failedChecks = result.checks?.filter((c) => !c.passed && c.severity === 'error') ?? [];
  if (failedChecks.length > 0) {
    console.log(chalk.red.bold('\nErrors:'));
    failedChecks.forEach((check, i) => {
      console.log(chalk.red(`  ${i + 1}. ${check.name}: ${check.message}`));
    });
  } else if (result.errors?.length) {
    console.log(chalk.red.bold('\nErrors:'));
    result.errors.forEach((error, i) => {
      console.log(chalk.red(`  ${i + 1}. ${error.field}: ${error.message}`));
    });
  }

  const warnings = result.checks?.filter((c) => !c.passed && c.severity === 'warning') ?? [];
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

    console.log(chalk.gray('Sending to validator.agent-manifest.com...'));
    const result = await validateManifestRemote(manifest);
    printResult(result);

    if (result.passed) {
      console.log(chalk.cyan('\nNext step: Run "amp publish" to submit to registry'));
    }
    process.exit(result.passed ? 0 : 1);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(chalk.red('❌ Could not reach the validator API'));
      if (error.response?.data) {
        console.error(chalk.gray(JSON.stringify(error.response.data, null, 2)));
      }
    } else {
      const e = error as { code?: string; message?: string };
      if (e.code === 'ENOENT') {
        console.error(chalk.red('❌ File Not Found'));
        console.error(chalk.gray('\nRun "amp init" to create a new manifest.'));
      } else {
        console.error(chalk.red(`❌ ${e.message ?? error}`));
      }
    }
    process.exit(1);
  }
}
