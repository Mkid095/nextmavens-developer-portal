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

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

function formatNumber(num?: number): string {
  return num?.toLocaleString() ?? 'N/A';
}

export async function functionsList(): Promise<void> {
  try {
    console.log('\nNextMavens Functions List');
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

    // List functions
    console.log('\nFetching functions...');

    const functions = await apiClient.listFunctions(projectConfig.project_id);

    if (functions.length === 0) {
      console.log('\nNo functions deployed yet.');
      console.log('\nDeploy your first function with:');
      console.log('  nextmavens functions deploy');
      process.exit(0);
    }

    console.log(`\nFound ${functions.length} function(s):\n`);

    // Display functions in a table-like format
    for (const func of functions) {
      console.log(`Function: ${func.name}`);
      console.log(`  ID:       ${func.id}`);
      console.log(`  Slug:     ${func.slug}`);
      console.log(`  Status:   ${func.status}`);
      console.log(`  URL:      ${func.url}`);
      console.log(`  Version:  ${func.version}`);
      console.log(`  Invocations: ${formatNumber(func.invocation_count)}`);
      console.log(`  Last invoked: ${formatDate(func.last_invocation)}`);
      console.log(`  Created:  ${formatDate(func.created_at)}`);
      console.log(`  Updated:  ${formatDate(func.updated_at)}`);
      console.log('');
    }

    // Summary
    const activeCount = functions.filter((f) => f.status === 'active' || f.status === 'deployed').length;
    const totalInvocations = functions.reduce((sum, f) => sum + (f.invocation_count || 0), 0);

    console.log('Summary:');
    console.log(`  Total functions:    ${functions.length}`);
    console.log(`  Active functions:   ${activeCount}`);
    console.log(`  Total invocations:  ${formatNumber(totalInvocations)}`);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to list functions.');
      } else if (error.statusCode === 404) {
        console.error('Project not found or functions not enabled.');
      }
    } else {
      console.error('\n✗ Failed to list functions:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
