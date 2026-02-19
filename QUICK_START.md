# AMP CLI - Quick Start Guide

Get started with the Agent Manifest Protocol CLI in 5 minutes.

## Installation

```bash
npm install -g @agentmanifest/cli
```

## Basic Usage

### 1. Create a New Manifest

```bash
cd /path/to/your/api
amp init
```

Creates `agent-manifest.json`. Edit it to add your API details.

### 2. Validate Your Manifest

```bash
amp validate
```

### 3. Publish to Registry

```bash
amp publish
```

## Example: Complete Workflow

```bash
# Navigate to your API project
cd ~/projects/my-api

# Create manifest interactively
amp init
# Answer the prompts...

# Check if it's valid
amp validate

# If validation passes, publish
amp publish

# Done! Your API is now discoverable by AI agents
```

## Minimal Manifest Example

`amp init` creates a scaffold like this. Edit to add your API details:

```json
{
  "spec_version": "agentmanifest-0.2",
  "name": "Weather Data API",
  "version": "1.0.0",
  "description": "Provides real-time weather data and forecasts for locations worldwide with high accuracy and comprehensive coverage including current conditions, hourly forecasts, and historical data.",
  "categories": ["weather"],
  "primary_category": "live",
  "endpoints": [
    {
      "path": "/current",
      "method": "GET",
      "description": "Get current weather for a location",
      "parameters": [],
      "response_description": "Current weather conditions including temperature and conditions"
    }
  ],
  "pricing": {
    "model": "free",
    "free_tier": { "queries_per_day": null, "queries_per_month": null }
  },
  "authentication": {
    "required": false,
    "type": "none"
  },
  "reliability": {
    "maintained_by": "organization"
  },
  "agent_notes": "Simple weather API. Use location parameter with city names or coordinates for precise results.",
  "contact": "support@weather-data.com",
  "listing_requested": true,
  "last_updated": "2026-02-15T10:30:00Z"
}
```

## Common Workflows

### Check Validation Without Publishing

```bash
amp validate
```

### Validate Custom File

```bash
amp validate -f ./custom-manifest.json
```

### Publish Custom File

```bash
amp publish -f ./custom-manifest.json
```

### Update Existing Manifest

```bash
# Edit your manifest file manually
vim agent-manifest.json

# Validate the changes
amp validate

# If valid, publish the update
amp publish
```

## Tips

1. **Description Length**: Must be ≥100 characters. Be descriptive!
2. **Agent Notes**: Must be ≥50 characters. Tell agents how to use your API.
3. **Categories**: Choose the most relevant. Primary category (reference, live, computational, etc.) is separate from categories.
4. **Homepage**: Host your manifest at `https://your-api.com/.well-known/agent-manifest.json`

## Hosting Your Manifest

After creating your manifest, you need to host it at:

```
https://your-api.com/.well-known/agent-manifest.json
```

### Express.js Example

```javascript
const express = require('express');
const manifest = require('./agent-manifest.json');

const app = express();

app.get('/.well-known/agent-manifest.json', (req, res) => {
  res.json(manifest);
});

app.listen(3000);
```

### Static Hosting

Just place your `agent-manifest.json` file in:
```
public/.well-known/agent-manifest.json
```

## Troubleshooting

### "Description too short"
Make your description at least 100 characters. Explain what your API does in detail.

### "Agent notes too short"
Make agent notes at least 50 characters. Provide implementation guidance for AI agents.

### "Invalid primary category"
Your primary_category must be one of these API types: "reference", "live", "computational", "transactional", "enrichment", "personal", or "discovery".

### "File not found"
Run `amp init` first to create a manifest, or use `-f` flag to specify the file path.

## Next Steps

1. **Read the full README**: `cat README.md`
2. **Check the spec**: Visit https://agent-manifest.com/docs
3. **See examples**: Check out BakeBase at https://github.com/AMProtocol/BakeBase
4. **Join the community**: Follow updates at https://agent-manifest.com

## Help

- Run `amp --help` for command list
- Run `amp <command> --help` for command details
- Visit https://agent-manifest.com for documentation
- Email: brandon@agent-manifest.com

---

**Ready to make your API discoverable by AI agents? Run `amp init` now!**
