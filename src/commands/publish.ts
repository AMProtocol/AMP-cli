import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import inquirer from 'inquirer';

const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';
const REGISTRY_URL = 'https://agent-manifest.com/listings/submit';

interface PublishOptions {
  file?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

interface PublishResult {
  success: boolean;
  listing_id?: string;
  message?: string;
  url?: string;
}

export async function publishCommand(options: PublishOptions) {
  const filePath = path.resolve(process.cwd(), options.file || './agent-manifest.json');

  console.log(chalk.cyan.bold('\n📤 Publishing Agent Manifest\n'));
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

    // Ensure manifest has a homepage URL for the submission
    if (!manifest.homepage) {
      console.log(chalk.yellow('\n⚠️  Missing Homepage URL'));
      console.log(chalk.gray('The registry needs your API base URL to fetch the manifest.\n'));

      const { homepage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'homepage',
          message: 'Enter your API base URL (where /.well-known/agent-manifest.json is hosted):',
          validate: (input) => {
            if (!input) return 'Homepage URL is required for publishing';
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

      // Update the file with the homepage
      await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
      console.log(chalk.gray(`Updated manifest with homepage: ${homepage}\n`));
    }

    // Step 1: Validate
    console.log(chalk.gray('Step 1/2: Validating manifest...'));

    try {
      const validateResponse = await axios.post<ValidationResult>(
        VALIDATOR_URL,
        { manifest },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!validateResponse.data.valid) {
        console.log(chalk.red.bold('❌ Validation Failed'));

        if (validateResponse.data.errors && validateResponse.data.errors.length > 0) {
          console.log(chalk.red.bold('\nErrors:'));
          validateResponse.data.errors.forEach((error, index) => {
            console.log(chalk.red(`  ${index + 1}. ${error.field}: ${error.message}`));
          });
        }

        console.log(chalk.gray('\nPlease fix the errors and try again.'));
        console.log(chalk.cyan('Run "amp validate" for detailed validation output.'));
        process.exit(1);
      }

      console.log(chalk.green('✓ Validation passed'));
    } catch (validationError: any) {
      console.error(chalk.red('❌ Validation Failed'));

      if (axios.isAxiosError(validationError) && validationError.response) {
        const errorData = validationError.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          console.log(chalk.red.bold('\nErrors:'));
          errorData.errors.forEach((error: any, index: number) => {
            const field = error.field || error.path || 'unknown';
            const message = error.message || error.msg || 'Unknown error';
            console.log(chalk.red(`  ${index + 1}. ${field}: ${message}`));
          });
        }
      } else {
        console.error(chalk.gray(`\n${validationError.message}`));
      }

      console.log(chalk.gray('\nPlease fix the errors and try again.'));
      process.exit(1);
    }

    // Step 2: Publish
    console.log(chalk.gray('Step 2/2: Submitting to registry...'));

    try {
      const publishResponse = await axios.post<PublishResult>(
        REGISTRY_URL,
        {
          url: manifest.homepage,
          manifest,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const result = publishResponse.data;

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Successfully Published!'));

        if (result.listing_id) {
          console.log(chalk.gray(`\nListing ID: ${result.listing_id}`));
        }

        if (result.url) {
          console.log(chalk.gray(`View at: ${result.url}`));
        }

        if (result.message) {
          console.log(chalk.cyan(`\n${result.message}`));
        }

        console.log(chalk.gray('\nYour API is now discoverable in the AMP registry!'));
        console.log(chalk.gray('AI agents can find and use your API through:'));
        console.log(chalk.cyan(`  ${manifest.homepage}/.well-known/agent-manifest.json`));
      } else {
        console.log(chalk.red.bold('❌ Publication Failed'));
        if (result.message) {
          console.log(chalk.red(`\n${result.message}`));
        }
        process.exit(1);
      }
    } catch (publishError: any) {
      if (axios.isAxiosError(publishError)) {
        if (publishError.response) {
          console.error(chalk.red('❌ Publication Failed'));
          console.error(chalk.gray(`\nRegistry Error: ${publishError.response.status} ${publishError.response.statusText}`));

          if (publishError.response.data) {
            const errorData = publishError.response.data;

            if (errorData.message) {
              console.log(chalk.red(`\n${errorData.message}`));
            } else if (errorData.error) {
              console.log(chalk.red(`\n${errorData.error}`));
            } else {
              console.log(chalk.red(`\n${JSON.stringify(errorData, null, 2)}`));
            }
          }

          console.log(chalk.gray('\nPossible reasons:'));
          console.log(chalk.gray('  - Manifest not accessible at the specified URL'));
          console.log(chalk.gray('  - API already registered'));
          console.log(chalk.gray('  - Registry service temporarily unavailable'));
        } else if (publishError.request) {
          console.error(chalk.red('❌ Connection Error'));
          console.error(chalk.gray('\nCould not connect to registry.'));
          console.error(chalk.gray('Please check your internet connection and try again.'));
        } else {
          console.error(chalk.red('❌ Request Error'));
          console.error(chalk.gray(`\n${publishError.message}`));
        }
      } else {
        throw publishError;
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
