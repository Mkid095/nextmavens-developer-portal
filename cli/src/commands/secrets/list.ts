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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export async function secretsList(): Promise<void> {
  try {
    console.log('\nNextMavens Secrets List');
    console.log('------------------------\n');

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

    console.log(`Project: ${projectConfig.project_name} (${projectConfig.slug})`);
    console.log(`Project ID: ${projectConfig.project_id}`);

    // List secrets
    console.log('\nFetching secrets...');

    const secrets = await apiClient.listSecrets(projectConfig.project_id);

    if (secrets.length === 0) {
      console.log('\nNo secrets configured yet.');
      console.log('\nSet your first secret with:');
      console.log('  nextmavens secrets set <key> <value>');
      process.exit(0);
    }

    console.log(`\nFound ${secrets.length} secret(s):\n`);

    // Display secrets in a table-like format (values hidden)
    for (const secret of secrets) {
      const maskedValue = '•'.repeat(12);
      console.log(`${secret.name}: ${maskedValue}`);
      console.log(`  Created:  ${formatDate(secret.created_at)}`);
      console.log(`  Updated:  ${formatDate(secret.updated_at)}`);
      console.log('');
    }

    // Summary
    console.log(`Total secrets: ${secrets.length}`);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to list secrets.');
      } else if (error.statusCode === 404) {
        console.error('Project not found.');
      }
    } else {
      console.error('\n✗ Failed to list secrets:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
