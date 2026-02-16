# Changelog

All notable changes to the AMP CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] - 2026-02-16

### Fixed
- Fixed `amp --version` command to read version dynamically from package.json instead of hardcoded value

## [0.1.6] - 2026-02-16

### Fixed
- Fixed validator response handling - CLI now correctly reads `passed` field instead of non-existent `valid` field
- Improved validation success output to show count of passed checks
- Fixed TypeScript interface to match actual validator API response structure

## [0.1.5] - 2026-02-16

### Fixed
- Improved error messages when validator returns no specific error details
- Added fallback to display full validator response for debugging

## [0.1.4] - 2026-02-16

### Fixed
- Updated documentation with correct package name and command syntax
- Corrected primary_category examples to use API types (reference, live, computational, etc.) instead of domain categories
- Standardized category spelling to use hyphens (food-science)

## [0.1.3] - 2026-02-16

### Changed
- Internal improvements and bug fixes

## [0.1.2] - 2026-02-16

### Changed
- Internal improvements and bug fixes

## [0.1.1] - 2026-02-16

### Changed
- Internal improvements and bug fixes

## [0.1.0] - 2026-02-15

### Added
- Initial release of `@agentmanifest/cli`
- `amp init` command for interactive manifest creation
  - Full wizard for all AMP v0.1 specification fields
  - Support for multiple endpoints with parameters
  - Category selection from controlled vocabulary
  - Pricing and authentication configuration
  - Optional rate limits and reliability metrics
  - Contact information and agent notes
- `amp validate` command for manifest validation
  - Integration with validator API at validator.agent-manifest.com
  - Detailed error reporting with field-level validation
  - Warning messages for non-critical issues
- `amp publish` command for registry submission
  - Two-step process: validate then publish
  - Automatic homepage URL prompting if missing
  - Integration with registry API at agent-manifest.com
  - Clear success/failure messaging
- Comprehensive README with usage examples
- TypeScript support with full type definitions
- Error handling for common scenarios
- MIT License

### Features
- Interactive prompts using `inquirer`
- Colored terminal output using `chalk`
- Commander-based CLI structure
- HTTP API integration with `axios`
- Semantic versioning validation
- URL validation (HTTPS required)
- JSON syntax validation
- Category and primary category consistency checks
- Minimum character requirements for descriptions and agent notes

### Dependencies
- commander ^12.0.0
- inquirer ^9.2.15
- chalk ^4.1.2
- axios ^1.6.7
- TypeScript ^5.3.3

## [Unreleased]

### Planned
- Offline validation mode
- Manifest update command
- Multiple manifest management
- Template system for common API types
- Manifest comparison/diff tool
- Batch validation for multiple manifests
- JSON Schema export
- OpenAPI to AMP conversion
- Registry search from CLI
