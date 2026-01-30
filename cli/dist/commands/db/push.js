import * as fs from 'fs';
import * as path from 'path';
import { apiClient, ApiError } from '../../lib/api-client';

const SCHEMA_FILES = ['schema.sql', 'schema.prisma', 'migrations', 'supabase'];
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

function findSchemaFile(): string | null {
  const possiblePaths = [
    'schema.sql',
    'schema.prisma',
    'supabase/schema.sql',
    'migrations/schema.sql',
    'db/schema.sql',
    'database/schema.sql',
  ];

  for (const schemaPath of possiblePaths) {
    const fullPath = path.join(process.cwd(), schemaPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function readSchemaContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export async function dbPush(): Promise<void> {
  try {
    console.log('\nNextMavens Database Push');
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

    console.log(`Project: ${projectConfig.project_name} (${projectConfig.slug})`);
    console.log(`Project ID: ${projectConfig.project_id}`);

    // Find schema file
    const schemaPath = findSchemaFile();
    if (!schemaPath) {
      console.error('\n✗ Error: No schema file found');
      console.error('Looking for one of:');
      console.error('  - schema.sql');
      console.error('  - schema.prisma');
      console.error('  - supabase/schema.sql');
      console.error('  - migrations/schema.sql');
      console.error('  - db/schema.sql');
      console.error('  - database/schema.sql');
      console.error('\nCreate a schema.sql file in your project root to continue.');
      process.exit(1);
    }

    console.log(`Schema file: ${schemaPath}`);

    // Read schema content
    console.log('\nReading schema file...');
    const schemaContent = readSchemaContent(schemaPath);
    const lines = schemaContent.split('\n').length;
    console.log(`Schema loaded: ${lines} lines`);

    // Push schema to project database
    console.log('\nPushing schema to project database...');

    const response = await apiClient.dbPush(projectConfig.project_id, {
      schema: schemaContent,
      schema_file: path.basename(schemaPath),
    });

    console.log('\n✓ Schema push successful!');
    console.log(`Schema version: ${response.version}`);
    console.log(`Tables created: ${response.tables_created || 0}`);
    console.log(`Tables modified: ${response.tables_modified || 0}`);
    console.log(`Tables deleted: ${response.tables_deleted || 0}`);

    if (response.warnings && response.warnings.length > 0) {
      console.log('\nWarnings:');
      response.warnings.forEach((warning: string) => {
        console.log(`  ⚠ ${warning}`);
      });
    }

    console.log('\nDatabase schema updated successfully.');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to modify this database.');
      } else if (error.statusCode === 404) {
        console.error('Project not found or database not initialized.');
      }
    } else {
      console.error('\n✗ Push failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
