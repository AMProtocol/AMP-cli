import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { validateManifestObject } from '@agentmanifest/validator';

const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';

interface ValidateOptions {
  file?: string;
  remote?: boolean;  // Optional flag to use remote API validation
}

interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface LocalValidationResult {
  url: string;
  validated_at: string;
  passed: boolean;
  spec_version: string | null;
  checks: ValidationCheck[];
  verification_token: string | null;
}

export async function validateCommand(options: ValidateOptions) {
  const filePath = path.resolve(process.cwd(), options.file || './agent-manifest.json');

  console.log(chalk.cyan.bold('\n🔍 Validating Agent Manifest\n'));
  console.log(chalk.gray(`File: ${filePath}\n`));

  try {
    // Read the manifest file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let manifest;

    try {
      manifest = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(chalk.red('❌ Invalid JSON'));
      console.error(chalk.gray('The manifest file contains invalid JSON syntax.'));
      process.exit(1);
    }

    // Use local validation by default, remote API only if --remote flag is set
    if (options.remote) {
      console.log(chalk.gray('Sending to validator API...'));
      await validateRemote(manifest);
    } else {
      console.log(chalk.gray('Running local validation...\n'));
      await validateLocal(manifest);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red('❌ File Not Found'));
      console.error(chalk.gray(`\nCould not find manifest file at: ${filePath}`));
      console.error(chalk.gray('\nRun "amp init" to create a new manifest.'));
    } else if (error.code === 'EACCES') {
      console.error(chalk.red('❌ Permission Denied'));
      console.error(chalk.gray(`\nCannot read file: ${filePath}`));
    } else {
      console.error(chalk.red('❌ Unexpected Error'));
      console.error(chalk.gray(`\n${error.message}`));
    }
    process.exit(1);
  }
}

async function validateLocal(manifest: any) {
  try {
    const result: LocalValidationResult = await validateManifestObject(manifest, 'local-file');

    // Count errors and warnings
    const errors = result.checks.filter(check => !check.passed && check.severity === 'error');
    const warnings = result.checks.filter(check => !check.passed && check.severity === 'warning');

    if (result.passed) {
      console.log(chalk.green.bold('✅ Validation Passed'));
      console.log(chalk.gray(`\nYour manifest is compliant with AMP specification ${result.spec_version}`));

      if (warnings.length > 0) {
        console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
        warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning.name}: ${warning.message}`));
        });
      }

      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.gray('  1. Deploy your API with this manifest at /.well-known/agent-manifest.json'));
      console.log(chalk.gray('  2. Run "amp publish" to submit to the registry'));
      process.exit(0);
    } else {
      console.log(chalk.red.bold('❌ Validation Failed'));

      if (errors.length > 0) {
        console.log(chalk.red.bold('\nErrors:'));
        errors.forEach((error, index) => {
          console.log(chalk.red(`  ${index + 1}. ${error.name}: ${error.message}`));
        });
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow.bold('\nWarnings:'));
        warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning.name}: ${warning.message}`));
        });
      }

      console.log(chalk.gray('\nPlease fix the errors and try again.'));
      process.exit(1);
    }
  } catch (validationError: any) {
    console.error(chalk.red('❌ Validation Error'));
    console.error(chalk.gray(`\n${validationError.message}`));
    process.exit(1);
  }
}

async function validateRemote(manifest: any) {
  try {
    const response = await axios.post<ValidationResult>(
      VALIDATOR_URL,
      { manifest },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const result = response.data;

    if (result.valid) {
      console.log(chalk.green.bold('✅ Validation Passed'));
      console.log(chalk.gray('\nYour manifest is compliant with AMP specification v0.1'));

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
        result.warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning.field}: ${warning.message}`));
        });
      }

      console.log(chalk.cyan('\nNext step: Run "amp publish" to submit to registry'));
      process.exit(0);
    } else {
      console.log(chalk.red.bold('❌ Validation Failed'));

      if (result.errors && result.errors.length > 0) {
        console.log(chalk.red.bold('\nErrors:'));
        result.errors.forEach((error, index) => {
          console.log(chalk.red(`  ${index + 1}. ${error.field}: ${error.message}`));
        });
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow.bold('\nWarnings:'));
        result.warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning.field}: ${warning.message}`));
        });
      }

      console.log(chalk.gray('\nPlease fix the errors and try again.'));
      process.exit(1);
    }
  } catch (apiError: any) {
    if (axios.isAxiosError(apiError)) {
      if (apiError.response) {
        console.error(chalk.red('❌ Validation Failed'));
        console.error(chalk.gray(`\nAPI Error: ${apiError.response.status} ${apiError.response.statusText}`));

        if (apiError.response.data) {
          const errorData = apiError.response.data;

          if (errorData.errors && Array.isArray(errorData.errors)) {
            console.log(chalk.red.bold('\nErrors:'));
            errorData.errors.forEach((error: any, index: number) => {
              const field = error.field || error.path || 'unknown';
              const message = error.message || error.msg || 'Unknown error';
              console.log(chalk.red(`  ${index + 1}. ${field}: ${message}`));
            });
          } else if (errorData.message) {
            console.log(chalk.red(`\n${errorData.message}`));
          } else {
            console.log(chalk.red(`\n${JSON.stringify(errorData, null, 2)}`));
          }
        }
      } else if (apiError.request) {
        console.error(chalk.red('❌ Connection Error'));
        console.error(chalk.gray('\nCould not connect to validator API.'));
        console.error(chalk.gray('Please check your internet connection and try again.'));
      } else {
        console.error(chalk.red('❌ Request Error'));
        console.error(chalk.gray(`\n${apiError.message}`));
      }
    } else {
      throw apiError;
    }
    process.exit(1);
  }
}
