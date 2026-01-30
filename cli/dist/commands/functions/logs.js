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

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function formatLogLevel(level: string): string {
  const symbols: Record<string, string> = {
    info: '✓',
    warn: '⚠',
    error: '✗',
    debug: '○',
  };
  return symbols[level] || '•';
}

function formatLogLevelColor(level: string): string {
  // Simple prefix for log level (no ANSI codes for broader compatibility)
  const prefixes: Record<string, string> = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
    debug: '[DEBUG]',
  };
  return prefixes[level] || `[${level.toUpperCase()}]`;
}

export async function functionsLogs(args?: string[]): Promise<void> {
  try {
    // Parse arguments
    const functionName = args?.[0];
    const limitArg = args?.find((a) => a.startsWith('--limit='));
    const sinceArg = args?.find((a) => a.startsWith('--since='));

    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50;
    const since = sinceArg ? sinceArg.split('=')[1] : undefined;

    console.log('\nNextMavens Functions Logs');
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

    // Get function name
    let targetFunctionName = functionName;

    if (!targetFunctionName) {
      // Try to get function list and ask user or use first one
      const functions = await apiClient.listFunctions(projectConfig.project_id);

      if (functions.length === 0) {
        console.error('\n✗ Error: No functions found');
        console.error('Deploy a function first with: nextmavens functions deploy');
        process.exit(1);
      }

      if (functions.length === 1) {
        targetFunctionName = functions[0].name;
        console.log(`\nUsing function: ${targetFunctionName}`);
      } else {
        console.error('\n✗ Error: Multiple functions found');
        console.error('Please specify a function name:');
        functions.forEach((f) => console.error(`  - ${f.name}`));
        console.error('\nUsage: nextmavens functions logs <function-name>');
        process.exit(1);
      }
    }

    // Fetch logs
    console.log(`\nFetching logs for: ${targetFunctionName}`);
    console.log(`Limit: ${limit} entries${since ? ` since ${since}` : ''}\n`);

    const response = await apiClient.getFunctionLogs(
      projectConfig.project_id,
      targetFunctionName,
      { limit, since }
    );

    if (response.logs.length === 0) {
      console.log('No logs found for this function.');
      console.log('\nInvoke your function to generate logs, or try:');
      console.log(`  nextmavens functions logs ${targetFunctionName} --since=1h`);
      process.exit(0);
    }

    console.log(`Found ${response.logs.length} log entry(ies):\n`);

    // Display logs
    for (const log of response.logs) {
      const levelPrefix = formatLogLevelColor(log.level);
      const levelSymbol = formatLogLevel(log.level);

      console.log(`${levelSymbol} ${levelPrefix} ${formatTimestamp(log.timestamp)}`);
      console.log(`  Function: ${response.function_name}`);

      if (log.message) {
        console.log(`  Message:  ${log.message}`);
      }

      if (log.metadata && Object.keys(log.metadata).length > 0) {
        console.log('  Metadata:');
        for (const [key, value] of Object.entries(log.metadata)) {
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          console.log(`    ${key}: ${displayValue}`);
        }
      }

      console.log('');
    }

    // Summary
    const errorCount = response.logs.filter((l) => l.level === 'error').length;
    const warnCount = response.logs.filter((l) => l.level === 'warn').length;

    console.log('Summary:');
    console.log(`  Total logs:  ${response.logs.length}`);
    console.log(`  Errors:      ${errorCount}`);
    console.log(`  Warnings:    ${warnCount}`);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to view function logs.');
      } else if (error.statusCode === 404) {
        console.error('Function or project not found.');
      }
    } else {
      console.error('\n✗ Failed to fetch logs:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
