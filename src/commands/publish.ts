import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import inquirer from 'inquirer';

const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';
const REGISTRY_URL = 'https://api.agent-manifest.com/listings/submit';

interface PublishOptions {
  file?: string;
}

interface ValidationResult {
  passed: boolean;
  url: string;
  validated_at: string;
  spec_version: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    severity: string;
  }>;
  verification_token?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

interface PublishResult {
  success?: boolean;
  listing_id?: string;
  message?: string;
  url?: string;
  meta?: {
    spec_version: string;
    endpoint_description: string;
  };
  data?: {
    submission_id: string;
    status: string;
    status_url: string;
    message: string;
  };
}

interface StatusResult {
  submission_id: string;
  url?: string;
  status: 'pending' | 'validating' | 'approved' | 'rejected' | 'completed';
  created_at?: string;
  validated_at?: string;
  listing_id?: string;
  listing_url?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
  }>;
  message?: string;
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

      if (!validateResponse.data.passed) {
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

      // Handle async submission response
      if (result.data?.submission_id) {
        const submissionId = result.data.submission_id;
        const statusUrl = result.data.status_url;

        console.log(chalk.green('✓ Submission accepted'));
        console.log(chalk.gray(`\nSubmission ID: ${submissionId}`));
        console.log(chalk.gray('Status: Validating...'));

        // Poll for status
        const baseUrl = REGISTRY_URL.replace('/listings/submit', '');
        const fullStatusUrl = `${baseUrl}${statusUrl}`;

        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max
        let finalStatus: StatusResult | null = null;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;

          try {
            const statusResponse = await axios.get<StatusResult>(fullStatusUrl, { timeout: 5000 });
            finalStatus = statusResponse.data;

            if (finalStatus.status === 'approved' || finalStatus.status === 'completed') {
              console.log(chalk.green.bold('\n✅ Successfully Published!'));
              if (finalStatus.listing_id) {
                console.log(chalk.gray(`\nListing ID: ${finalStatus.listing_id}`));
              }
              if (finalStatus.listing_url) {
                const fullListingUrl = finalStatus.listing_url.startsWith('http')
                  ? finalStatus.listing_url
                  : `https://api.agent-manifest.com${finalStatus.listing_url}`;
                console.log(chalk.gray(`View at: ${fullListingUrl}`));
              }
              console.log(chalk.gray('\nYour API is now discoverable in the AMP registry!'));
              console.log(chalk.gray('AI agents can find and use your API through:'));
              console.log(chalk.cyan(`  ${manifest.homepage}/.well-known/agent-manifest.json`));
              process.exit(0);
            } else if (finalStatus.status === 'rejected') {
              console.log(chalk.red.bold('\n❌ Publication Rejected'));
              if (finalStatus.validation_errors && finalStatus.validation_errors.length > 0) {
                console.log(chalk.red.bold('\nValidation Errors:'));
                finalStatus.validation_errors.forEach((error, index) => {
                  console.log(chalk.red(`  ${index + 1}. ${error.field}: ${error.message}`));
                });
              } else if (finalStatus.message) {
                console.log(chalk.red(`\n${finalStatus.message}`));
              }
              process.exit(1);
            }
            // Still pending/validating, continue polling
          } catch (statusError) {
            // Ignore polling errors, will retry
          }
        }

        // Timeout
        console.log(chalk.yellow.bold('\n⏱️  Validation Timeout'));
        console.log(chalk.gray(`\nValidation is taking longer than expected.`));
        console.log(chalk.gray(`Check status manually:`));
        console.log(chalk.cyan(`  ${fullStatusUrl}`));
        process.exit(1);
      }
      // Handle legacy sync response (if registry changes back)
      else if (result.success) {
        console.log(chalk.green.bold('\n✅ Successfully Published!'));
        if (result.listing_id) {
          console.log(chalk.gray(`\nListing ID: ${result.listing_id}`));
        }
        if (result.url) {
          console.log(chalk.gray(`View at: ${result.url}`));
        }
        console.log(chalk.gray('\nYour API is now discoverable in the AMP registry!'));
        console.log(chalk.gray('AI agents can find and use your API through:'));
        console.log(chalk.cyan(`  ${manifest.homepage}/.well-known/agent-manifest.json`));
      } else {
        console.log(chalk.red.bold('❌ Publication Failed'));
        console.log(chalk.gray('\nUnexpected response format:'));
        console.log(chalk.gray(JSON.stringify(result, null, 2)));
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
