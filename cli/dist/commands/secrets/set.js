import * as fs from 'fs';
import * as path from 'path';
import { apiClient, ApiError } from '../../lib/api-client';

const LOCAL_CONFIG_DIR = '.nextmavens';

interface LocalProjectConfig {
  project_id: string;
  project_name: string;
  slug: string;
}

function getLocalProjectConfigPath(): string {
  return path.join(process.cwd(), LOCAL_CONFIG_DIR, 'config.json');
}

function readLocalProjectConfig(): LocalProjectConfig | null {
  const configPath = getLocalProjectConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data) as LocalProjectConfig;
  } catch {
    return null;
  }
}

export async function secretsSet(key: string, value: string): Promise<void> {
  try {
    console.log('\nNextMavens Secrets Set');
    console.log('-----------------------\n');

    // Check authentication
    if (!apiClient.isAuthenticated()) {
      console.error('✗ Error: Not authenticated');
      console.error('Please login first with: nextmavens login');
      process.exit(1);
    }

    // Get linked project
    const projectConfig = readLocalProjectConfig();
    if (!projectConfig) {
      console.error('✗ Error: No project linked to current directory');
      console.error('Please link a project first with:');
      console.error('  1. nextmavens project link <project-id>');
      console.error('  2. Or create a new project: nextmavens project create <name>');
      process.exit(1);
    }

    // Validate key
    if (!key || key.trim().length === 0) {
      console.error('✗ Error: Secret key is required');
      console.error('Usage: nextmavens secrets set <key> <value>');
      process.exit(1);
    }

    // Validate value
    if (value === undefined || value === null) {
      console.error('✗ Error: Secret value is required');
      console.error('Usage: nextmavens secrets set <key> <value>');
      process.exit(1);
    }

    console.log(`Project: ${projectConfig.project_name} (${projectConfig.slug})`);
    console.log(`Setting secret: ${key}`);

    // Set the secret
    const result = await apiClient.setSecret(projectConfig.project_id, key, value);

    if (result.success) {
      console.log('\n✓ Secret set successfully');
      console.log(`  Name: ${result.secret.name}`);
      console.log(`  Created: ${new Date(result.secret.created_at).toLocaleString()}`);
      console.log(`  Updated: ${new Date(result.secret.updated_at).toLocaleString()}`);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to set secrets.');
      } else if (error.statusCode === 404) {
        console.error('Project not found.');
      } else if (error.statusCode === 400) {
        console.error('Invalid secret key or value. Keys must be alphanumeric with underscores.');
      }
    } else {
      console.error('\n✗ Failed to set secret:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
