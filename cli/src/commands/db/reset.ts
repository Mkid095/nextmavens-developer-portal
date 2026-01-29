import * as readline from 'readline';
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

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function dbReset(): Promise<void> {
  try {
    console.log('\nNextMavens Database Reset');
    console.log('-------------------------');
    console.log('\n⚠️  WARNING: This will delete all data in the database!');
    console.log('This action cannot be undone.\n');

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

    // First confirmation: type project name
    const confirmation1 = await question(
      `Type "${projectConfig.project_name}" to confirm: `
    );

    if (confirmation1 !== projectConfig.project_name) {
      console.error('\n✗ Cancelled: Project name does not match.');
      console.error('Database reset aborted for your safety.');
      process.exit(1);
    }

    // Second confirmation: type "I understand"
    const confirmation2 = await question(
      'This will DELETE ALL DATA. Type "I understand" to continue: '
    );

    if (confirmation2 !== 'I understand') {
      console.error('\n✗ Cancelled: Confirmation phrase does not match.');
      console.error('Database reset aborted for your safety.');
      process.exit(1);
    }

    // Final confirmation
    const confirmation3 = await question('Last chance! Type "RESET" to proceed: ');

    if (confirmation3 !== 'RESET') {
      console.error('\n✗ Cancelled: Final confirmation failed.');
      console.error('Database reset aborted. Your data is safe!');
      process.exit(1);
    }

    console.log('\n⏳ Resetting database...');
    console.log('This may take a moment...');

    // Call API to reset database
    const response = await apiClient.dbReset(projectConfig.project_id);

    console.log('\n✓ Database reset successful!');
    console.log(`Database version: ${response.version}`);
    console.log(`Tables initialized: ${response.tables_initialized || 0}`);

    if (response.warnings && response.warnings.length > 0) {
      console.log('\nWarnings:');
      response.warnings.forEach((warning: string) => {
        console.log(`  ⚠ ${warning}`);
      });
    }

    console.log('\nYour database has been reset to its initial state.');
    console.log('All previous data has been permanently deleted.');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to reset this database.');
        console.error('Database reset requires elevated permissions.');
      } else if (error.statusCode === 404) {
        console.error('Project not found or database not initialized.');
      } else if (error.statusCode === 409) {
        console.error('Cannot reset production database.');
        console.error('Database reset is only available in development environments.');
      }
    } else {
      console.error('\n✗ Reset failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
