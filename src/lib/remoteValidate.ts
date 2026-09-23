import axios from 'axios';

export const VALIDATOR_URL = 'https://validator.agent-manifest.com/validate';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  passed: boolean;
  spec_version: string | null;
  checks: ValidationCheck[];
  badges?: string[];
  errors?: Array<{ field: string; message: string }>;
}

export async function validateManifestRemote(
  manifest: Record<string, unknown>,
  url?: string
): Promise<ValidationResult> {
  const response = await axios.post<ValidationResult>(
    VALIDATOR_URL,
    { manifest, url: url ?? manifest.homepage ?? 'local-file' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return response.data;
}
