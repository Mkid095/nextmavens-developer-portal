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

function formatDiffOutput(diff: any): string {
  let output = '';

  if (diff.tables_created && diff.tables_created.length > 0) {
    output += '\nTables to be created:\n';
    diff.tables_created.forEach((table: string) => {
      output += `  + ${table}\n`;
    });
  }

  if (diff.tables_modified && diff.tables_modified.length > 0) {
    output += '\nTables to be modified:\n';
    diff.tables_modified.forEach((table: any) => {
      output += `  ~ ${table.name}\n`;
      if (table.changes) {
        table.changes.forEach((change: string) => {
          output += `    ${change}\n`;
        });
      }
    });
  }

  if (diff.tables_deleted && diff.tables_deleted.length > 0) {
    output += '\nTables to be deleted:\n';
    diff.tables_deleted.forEach((table: string) => {
      output += `  - ${table}\n`;
    });
  }

  if (diff.columns_created && diff.columns_created.length > 0) {
    output += '\nColumns to be created:\n';
    diff.columns_created.forEach((col: any) => {
      output += `  + ${col.table}.${col.column} (${col.type})\n`;
    });
  }

  if (diff.columns_deleted && diff.columns_deleted.length > 0) {
    output += '\nColumns to be deleted:\n';
    diff.columns_deleted.forEach((col: any) => {
      output += `  - ${col.table}.${col.column}\n`;
    });
  }

  return output;
}

export async function dbDiff(): Promise<void> {
  try {
    console.log('\nNextMavens Database Diff');
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

    // Find schema file
    const schemaPath = findSchemaFile();
    let schemaContent = '';

    if (schemaPath) {
      console.log(`Local schema: ${schemaPath}`);
      schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    } else {
      console.warn('\n⚠ Warning: No local schema file found');
      console.warn('Diff will show remote database schema only.');
    }

    // Get diff from API
    console.log('\nComputing schema differences...');

    const response = await apiClient.dbDiff(projectConfig.project_id, {
      schema: schemaContent || undefined,
    });

    console.log('\n✓ Diff computed successfully!\n');

    if (response.has_changes) {
      console.log('Changes detected:');
      console.log('=================\n');

      const diffOutput = formatDiffOutput(response);
      console.log(diffOutput);

      console.log('Summary:');
      console.log(`  Tables created: ${response.summary?.tables_created || 0}`);
      console.log(`  Tables modified: ${response.summary?.tables_modified || 0}`);
      console.log(`  Tables deleted: ${response.summary?.tables_deleted || 0}`);
      console.log(`  Columns created: ${response.summary?.columns_created || 0}`);
      console.log(`  Columns deleted: ${response.summary?.columns_deleted || 0}`);

      console.log('\nTo apply these changes, run:');
      console.log('  nextmavens db push');
    } else {
      console.log('✓ No changes detected!');
      console.log('Your local schema matches the remote database.');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to access this database.');
      } else if (error.statusCode === 404) {
        console.error('Project not found or database not initialized.');
      }
    } else {
      console.error('\n✗ Diff failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
