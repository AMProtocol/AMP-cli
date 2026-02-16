# AMP CLI - Project Structure

Complete Node.js CLI tool for the Agent Manifest Protocol, ready for npm publication.

## Directory Structure

```
amp-cli/
├── src/                          # TypeScript source files
│   ├── commands/                 # Command implementations
│   │   ├── init.ts              # Interactive manifest creation
│   │   ├── validate.ts          # Manifest validation
│   │   └── publish.ts           # Registry submission
│   ├── constants.ts             # Controlled vocabularies
│   ├── types.ts                 # TypeScript type definitions
│   └── index.ts                 # CLI entry point
├── dist/                         # Compiled JavaScript (generated)
│   ├── commands/
│   ├── *.js
│   ├── *.d.ts
│   └── *.map
├── node_modules/                # Dependencies (gitignored)
├── package.json                 # Package configuration
├── tsconfig.json                # TypeScript configuration
├── README.md                    # Comprehensive documentation
├── CHANGELOG.md                 # Version history
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
└── .npmignore                   # npm publish exclusions
```

## Files Overview

### Source Files (`src/`)

#### `index.ts` (Entry Point)
- Sets up Commander CLI structure
- Defines three main commands: init, validate, publish
- Includes version and help information

#### `commands/init.ts` (Interactive Scaffolding)
- Full wizard for creating agent-manifest.json
- Inquirer prompts for all required fields
- Validates user input in real-time
- Supports multiple endpoints with parameters
- Generates compliant AMP v0.1 manifest

#### `commands/validate.ts` (Validation)
- Reads manifest from filesystem
- POSTs to validator API at validator.agent-manifest.com
- Displays detailed error/warning messages
- Provides clear pass/fail feedback

#### `commands/publish.ts` (Registry Submission)
- Two-step process: validate then publish
- Prompts for missing homepage URL
- Submits to registry at agent-manifest.com
- Returns listing ID and registry URL

#### `constants.ts` (Controlled Vocabularies)
- Standard categories (15 categories)
- Pricing models (free, usage_based, subscription)
- Authentication types (none, api_key, oauth2, bearer)

#### `types.ts` (TypeScript Definitions)
- Complete type definitions for AMP v0.1
- Interfaces for all manifest sections
- Type safety for parameters and responses

### Configuration Files

#### `package.json`
- Package name: `@agentmanifest/cli`
- Binary: `amp`
- Dependencies: commander, inquirer, chalk, axios
- DevDependencies: TypeScript, tsx, @types/*
- Build scripts
- Node.js 18+ requirement

#### `tsconfig.json`
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps and declarations

#### `.gitignore`
- node_modules, dist, logs
- OS files (.DS_Store)
- IDE files (.vscode, .idea)
- Environment variables

#### `.npmignore`
- Source files (only publish dist/)
- Tests and development files
- Documentation (except README)
- Git and CI/CD files

### Documentation

#### `README.md` (13 Sections)
1. Installation instructions
2. Requirements
3. Command reference (init, validate, publish)
4. Complete workflow examples
5. Manifest schema documentation
6. Validation rules
7. API endpoint references
8. Troubleshooting guide
9. Resources and links
10. Contributing guidelines
11. License information
12. Support contacts
13. Project vision

#### `CHANGELOG.md`
- Version history (semantic versioning)
- Initial v0.1.0 release notes
- Feature list
- Planned improvements

#### `LICENSE`
- MIT License
- Copyright 2026 Brandon Weber
- Full license text

## Key Features

### Interactive Creation (`amp init`)
- Step-by-step wizard
- Real-time validation
- Multi-endpoint support
- Parameter configuration
- Optional sections (rate limits, reliability)
- Contact information
- Agent guidance notes

### Validation (`amp validate`)
- API integration
- JSON syntax checking
- Field-level validation
- Length requirements (description ≥100, agent_notes ≥50)
- Semantic versioning check
- Category consistency
- Detailed error reporting

### Publication (`amp publish`)
- Pre-publication validation
- Homepage URL requirement
- Two-step submission process
- Registry integration
- Listing ID generation
- Success confirmation

## Dependencies

### Production
- `commander@^12.0.0` - CLI framework
- `inquirer@^9.2.15` - Interactive prompts
- `chalk@^4.1.2` - Terminal colors
- `axios@^1.6.7` - HTTP client

### Development
- `typescript@^5.3.3` - Type system
- `tsx@^4.7.1` - TypeScript executor
- `@types/node@^20.11.19` - Node.js types
- `@types/inquirer@^9.0.7` - Inquirer types

## Build Process

```bash
# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run build

# Development mode (no compilation)
npm run dev

# Prepare for publishing
npm run prepublishOnly
```

## Output (dist/)

The compiled output includes:
- JavaScript files (.js)
- TypeScript declarations (.d.ts)
- Source maps (.js.map, .d.ts.map)
- Preserves directory structure

## Testing

The CLI has been tested with:
- Successful compilation (TypeScript → JavaScript)
- Help command output verification
- Command structure validation
- Proper exit codes
- Error handling

## Publication Readiness

The package is ready to publish to npm:

```bash
# Login to npm
npm login

# Publish (runs prepublishOnly automatically)
npm publish --access public
```

## API Integration

### Validator API
- Endpoint: `https://validator.agent-manifest.com/validate`
- Method: POST
- Timeout: 10 seconds
- Returns: `{ valid: boolean, errors: [], warnings: [] }`

### Registry API
- Endpoint: `https://agent-manifest.com/listings/submit`
- Method: POST
- Timeout: 15 seconds
- Returns: `{ success: boolean, listing_id: string, url: string }`

## Command Line Interface

### Binary Name: `amp`

Available globally after `npm install -g @agentmanifest/cli`

### Commands
1. `amp init` - Create new manifest
2. `amp validate [-f <path>]` - Validate manifest
3. `amp publish [-f <path>]` - Publish to registry
4. `amp --version` - Show version
5. `amp --help` - Show help

## Error Handling

The CLI includes robust error handling for:
- File not found
- Invalid JSON syntax
- Validation failures
- API connection errors
- Permission denied
- Network timeouts
- Malformed responses

## Color Coding

Terminal output uses color coding:
- **Cyan**: Headers, informational
- **Green**: Success messages
- **Red**: Errors
- **Yellow**: Warnings
- **Gray**: Secondary information

## Future Enhancements

Planned for future versions:
- Offline validation mode
- Manifest update command
- Template system
- Batch operations
- OpenAPI conversion
- Registry search
- Diff tool

## Contributing

Contributions welcome at:
- Repository: https://github.com/AMProtocol/amp-cli
- Issues: Submit bugs and feature requests
- Pull Requests: Code contributions

## Support

- Email: brandon@agent-manifest.com
- GitHub: @brandon-weber
- Website: https://agent-manifest.com

---

**Status**: ✅ Complete and Ready for Publication

**Version**: 0.1.0

**Last Updated**: February 15, 2026
