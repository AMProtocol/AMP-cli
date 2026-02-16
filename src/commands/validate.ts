import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';

interface ValidateOptions {
  file?: string;
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

    // Send to validator API
    console.log(chalk.gray('Sending to validator API...'));

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
        } else {
          // If no errors array, show the entire response for debugging
          console.log(chalk.red.bold('\nValidation failed but no specific errors were provided.'));
          console.log(chalk.gray('\nValidator response:'));
          console.log(chalk.gray(JSON.stringify(result, null, 2)));
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
