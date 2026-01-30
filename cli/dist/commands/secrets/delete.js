import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
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

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, ans => {
      rl.close();
      resolve(ans);
    });
  });
}

export async function secretsDelete(key: string): Promise<void> {
  try {
    console.log('\nNextMavens Secrets Delete');
    console.log('-------------------------\n');

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
      console.error('Usage: nextmavens secrets delete <key>');
      process.exit(1);
    }

    console.log(`Project: ${projectConfig.project_name} (${projectConfig.slug})`);
    console.log(`Deleting secret: ${key}`);

    // Confirm deletion
    const confirmation = await askQuestion(`\nAre you sure you want to delete the secret "${key}"? This action cannot be undone. (yes/no): `);

    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
      console.log('\nDeletion cancelled.');
      process.exit(0);
    }

    // Delete the secret
    const result = await apiClient.deleteSecret(projectConfig.project_id, key);

    if (result.success) {
      console.log('\n✓ Secret deleted successfully');
      console.log(`  ${result.message}`);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to delete secrets.');
      } else if (error.statusCode === 404) {
        console.error('Project or secret not found.');
      }
    } else {
      console.error('\n✗ Failed to delete secret:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
