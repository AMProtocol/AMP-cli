# @agentmanifest/cli

Official CLI tool for the Agent Manifest Protocol (AMP). Create, validate, and publish API manifests that enable AI agents to discover and interact with your data APIs.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @agentmanifest/cli
```

After installation, the `amp` command will be available globally.

### Local Installation

```bash
npm install @agentmanifest/cli
npx amp --help
```

## Requirements

- Node.js 18.0.0 or higher
- npm or yarn

## Commands

### `amp init`

Interactively create a new `agent-manifest.json` file in the current directory.

```bash
amp init
```

This command walks you through all required fields defined in the AMP v0.1 specification:

- **Basic Information**: Name, version, description, URLs
- **Categories**: Primary and secondary categories from controlled vocabulary
- **Endpoints**: API endpoints with methods, parameters, and responses
- **Pricing**: Free, usage-based, or subscription models
- **Authentication**: None, API key, OAuth2, or bearer token
- **Rate Limits**: Request limits per minute/day (optional)
- **Reliability**: Uptime and response time metrics (optional)
- **Contact**: Support email, URLs, GitHub (optional)
- **Agent Notes**: Implementation guidance for AI agents (min 50 chars)

The generated manifest will be saved as `agent-manifest.json` in your current directory.

#### Example Session

```bash
$ amp init

🚀 Agent Manifest Protocol - Interactive Setup

📋 Basic Information
? API name: Chemistry Calculator API
? Version (semantic versioning): 1.0.0
? Description (min 100 characters): A comprehensive chemistry API providing molecular calculations, compound information, and reaction predictions for AI agents working with chemical data
? Homepage URL (optional): https://api.chemcalc.com
? Documentation URL (optional): https://docs.chemcalc.com

🏷️  Categories
? Select categories: chemistry, education
? Select primary category: chemistry

🔌 Endpoints
? Endpoint path: /calculate/molar-mass
? HTTP method: POST
? Endpoint description: Calculate molar mass of chemical compounds
? Response description: Returns molar mass in g/mol with compound details
? Add parameters to this endpoint? Yes
...

✅ Success!
Manifest created at: /path/to/agent-manifest.json
```

---

### `amp validate`

Validate your `agent-manifest.json` file against the AMP specification.

```bash
amp validate [options]
```

#### Options

- `-f, --file <path>` - Path to manifest file (default: `./agent-manifest.json`)

#### Examples

```bash
# Validate manifest in current directory
amp validate

# Validate specific file
amp validate -f ./my-manifest.json

# Validate manifest in subdirectory
amp validate -f ./api/agent-manifest.json
```

#### Output

**Successful validation:**

```bash
$ amp validate

🔍 Validating Agent Manifest

File: /path/to/agent-manifest.json

Sending to validator API...
✅ Validation Passed

Your manifest is compliant with AMP specification v0.1

Next step: Run "amp publish" to submit to registry
```

**Failed validation:**

```bash
$ amp validate

🔍 Validating Agent Manifest

File: /path/to/agent-manifest.json

Sending to validator API...
❌ Validation Failed

Errors:
  1. description: Must be at least 100 characters (currently 45)
  2. primary_category: Must be one of the categories in the categories array
  3. agent_notes: Must be at least 50 characters (currently 20)

Please fix the errors and try again.
```

---

### `amp publish`

Validate and publish your manifest to the AMP registry.

```bash
amp publish [options]
```

#### Options

- `-f, --file <path>` - Path to manifest file (default: `./agent-manifest.json`)

#### How It Works

1. **Validation**: First validates your manifest against the AMP specification
2. **Homepage Check**: Ensures your manifest includes a homepage URL (where `/.well-known/agent-manifest.json` is hosted)
3. **Submission**: Submits your API to the public registry at `https://agent-manifest.com`

#### Examples

```bash
# Publish manifest in current directory
amp publish

# Publish specific file
amp publish -f ./my-manifest.json
```

#### Output

**Successful publication:**

```bash
$ amp publish

📤 Publishing Agent Manifest

File: /path/to/agent-manifest.json

Step 1/2: Validating manifest...
✓ Validation passed
Step 2/2: Submitting to registry...

✅ Successfully Published!

Listing ID: lst_abc123xyz
View at: https://agent-manifest.com/listings/lst_abc123xyz

Your API is now discoverable in the AMP registry!
AI agents can find and use your API through:
  https://api.example.com/.well-known/agent-manifest.json
```

**Failed publication:**

```bash
$ amp publish

📤 Publishing Agent Manifest

Step 1/2: Validating manifest...
❌ Validation Failed

Errors:
  1. description: Must be at least 100 characters

Please fix the errors and try again.
Run "amp validate" for detailed validation output.
```

---

## Workflow

### Complete Setup Flow

```bash
# 1. Create a new manifest interactively
amp init

# 2. Review the generated file
cat agent-manifest.json

# 3. Validate the manifest
amp validate

# 4. Host the manifest at your API's /.well-known/agent-manifest.json endpoint

# 5. Publish to the registry
amp publish
```

---

## Manifest Schema (v0.1)

### Required Fields

- `spec_version`: Always `"agentmanifest-0.1"`
- `name`: API name (string)
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Min 100 characters
- `categories`: Array of domain categories (from controlled vocabulary below)
- `primary_category`: API type - one of: "reference", "live", "computational", "transactional", "enrichment", "personal", "discovery"
- `endpoints`: At least one endpoint required
- `pricing.model`: "free", "usage_based", or "subscription"
- `authentication.type`: "none", "api_key", "oauth2", or "bearer"
- `agent_notes`: Min 50 characters - guidance for AI agents

### Primary Category Types

- `reference`: Static knowledge bases, documentation, reference data
- `live`: Real-time data sources (weather, markets, sensors)
- `computational`: APIs that perform calculations or transformations
- `transactional`: APIs that execute actions or state changes
- `enrichment`: APIs that augment existing data with additional context
- `personal`: User-specific data requiring authentication
- `discovery`: Meta-APIs for finding other data sources

### Standard Domain Categories

```
chemistry, biology, physics, mathematics, finance, weather,
geography, food-science, engineering, legal, medical,
education, translation, media, general
```

### Example Manifest

```json
{
  "spec_version": "agentmanifest-0.1",
  "name": "Weather Data API",
  "version": "2.1.0",
  "description": "Real-time weather data and forecasts for locations worldwide. Provides current conditions, hourly forecasts, and historical weather data with high accuracy and global coverage.",
  "homepage": "https://api.weather-data.com",
  "documentation": "https://docs.weather-data.com",
  "categories": ["weather", "geography"],
  "primary_category": "live",
  "endpoints": [
    {
      "path": "/current",
      "method": "GET",
      "description": "Get current weather conditions for a location",
      "parameters": {
        "query": {
          "location": {
            "type": "string",
            "required": true,
            "description": "City name or coordinates (lat,lon)"
          }
        }
      },
      "response": {
        "type": "object",
        "description": "Current weather data including temperature, conditions, and metadata"
      }
    }
  ],
  "pricing": {
    "model": "usage_based",
    "details": "First 1000 requests free per month, then $0.001 per request"
  },
  "authentication": {
    "type": "api_key",
    "config": {
      "header": "X-API-Key",
      "signup_url": "https://api.weather-data.com/signup"
    }
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_day": 10000
  },
  "reliability_metrics": {
    "uptime_percentage": 99.9,
    "avg_response_time_ms": 150
  },
  "contact": {
    "email": "support@weather-data.com",
    "support_url": "https://support.weather-data.com"
  },
  "agent_notes": "Use the 'location' parameter with city names for simplicity. Coordinates provide more precise results. Response includes semantic metadata to help interpret weather conditions.",
  "listing_requested": true,
  "last_updated": "2026-02-15T10:30:00Z"
}
```

---

## Validation Rules

The validator checks for:

1. **Spec Version**: Must be `"agentmanifest-0.1"`
2. **Semantic Versioning**: Version must follow `x.y.z` format
3. **Description Length**: Minimum 100 characters
4. **Agent Notes Length**: Minimum 50 characters
5. **Category Consistency**: Primary category must be in categories array
6. **Endpoints**: At least one endpoint required
7. **Valid URLs**: All URLs must be HTTPS
8. **Required Fields**: All mandatory fields present
9. **Type Validation**: Fields match expected types

---

## API Endpoints

### Validator API

**POST** `https://validator.agent-manifest.com/validate`

Request body:
```json
{
  "manifest": { /* your manifest object */ }
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### Registry API

**POST** `https://agent-manifest.com/listings/submit`

Request body:
```json
{
  "url": "https://api.example.com",
  "manifest": { /* your manifest object */ }
}
```

Response:
```json
{
  "success": true,
  "listing_id": "lst_abc123",
  "url": "https://agent-manifest.com/listings/lst_abc123"
}
```

---

## Troubleshooting

### "File Not Found" Error

```bash
❌ File Not Found
Could not find manifest file at: /path/to/agent-manifest.json

Run "amp init" to create a new manifest.
```

**Solution**: Make sure you're in the correct directory or use the `-f` flag to specify the path.

### "Invalid JSON" Error

```bash
❌ Invalid JSON
The manifest file contains invalid JSON syntax.
```

**Solution**: Check your JSON syntax. Common issues include:
- Trailing commas
- Missing quotes around strings
- Unescaped special characters
- Mismatched brackets

### "Connection Error"

```bash
❌ Connection Error
Could not connect to validator API.
```

**Solution**: Check your internet connection and try again. The validator and registry services may be temporarily unavailable.

### Validation Errors

If you get validation errors, review the error messages carefully. Common issues:

- **Description too short**: Must be at least 100 characters
- **Agent notes too short**: Must be at least 50 characters
- **Invalid version**: Must follow semantic versioning (e.g., "1.0.0")
- **Category mismatch**: Primary category must be in your categories array
- **Missing endpoints**: At least one endpoint required

---

## Resources

- **Specification**: [Agent Manifest Protocol Docs](https://agent-manifest.com/docs)
- **Registry**: [Browse AMP-compliant APIs](https://agent-manifest.com/listings)
- **GitHub**: [AMProtocol Organization](https://github.com/AMProtocol)
- **Reference Implementation**: [BakeBase API](https://github.com/AMProtocol/BakeBase)

---

## Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/AMProtocol/amp-cli) to:

- Report bugs
- Suggest features
- Submit pull requests

---

## License

MIT License - See [LICENSE](LICENSE) file for details

---

## Support

- **Email**: brandon@agent-manifest.com
- **GitHub Issues**: [amp-cli/issues](https://github.com/AMProtocol/amp-cli/issues)
- **Website**: [agent-manifest.com](https://agent-manifest.com)

---

## About

The Agent Manifest Protocol is an open standard for API metadata that enables AI agents to dynamically discover, evaluate, and compensate data APIs at runtime. Created by Brandon Weber ([@brandon-weber](https://github.com/brandon-weber)).
