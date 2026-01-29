import * as fs from 'fs';
import * as path from 'path';
import { apiClient, ApiError } from '../../lib/api-client';

const FUNCTIONS_DIR = 'functions';
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

function findFunctionsDir(): string | null {
  const possiblePaths = [
    'functions',
    'fn',
    'edge-functions',
    'api/functions',
    'serverless/functions',
  ];

  for (const dirPath of possiblePaths) {
    const fullPath = path.join(process.cwd(), dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return fullPath;
    }
  }

  return null;
}

function getFunctionEntries(functionsDir: string): string[] {
  const entries: string[] = [];

  if (!fs.existsSync(functionsDir)) {
    return entries;
  }

  const files = fs.readdirSync(functionsDir);

  for (const file of files) {
    const fullPath = path.join(functionsDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Check for index file in subdirectory
      const indexPath = path.join(fullPath, 'index.ts');
      const jsIndexPath = path.join(fullPath, 'index.js');
      if (fs.existsSync(indexPath) || fs.existsSync(jsIndexPath)) {
        entries.push(file);
      }
    } else {
      // Check if it's a TypeScript or JavaScript file
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        entries.push(file.replace(/\.(ts|js)$/, ''));
      }
    }
  }

  return entries;
}

function getFunctionSource(functionsDir: string, functionName: string): string {
  const functionPath = path.join(functionsDir, functionName);
  const indexPath = path.join(functionPath, 'index.ts');
  const jsIndexPath = path.join(functionPath, 'index.js');
  const tsPath = path.join(functionsDir, `${functionName}.ts`);
  const jsPath = path.join(functionsDir, `${functionName}.js`);

  let sourcePath: string | null = null;
  if (fs.existsSync(indexPath)) {
    sourcePath = indexPath;
  } else if (fs.existsSync(jsIndexPath)) {
    sourcePath = jsIndexPath;
  } else if (fs.existsSync(tsPath)) {
    sourcePath = tsPath;
  } else if (fs.existsSync(jsPath)) {
    sourcePath = jsPath;
  }

  if (!sourcePath) {
    return '';
  }

  return fs.readFileSync(sourcePath, 'utf-8');
}

export async function functionsDeploy(args?: string[]): Promise<void> {
  try {
    console.log('\nNextMavens Functions Deploy');
    console.log('--------------------------\n');

    // Parse arguments
    const functionName = args?.[0];

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

    // Find functions directory
    const functionsDir = findFunctionsDir();
    if (!functionsDir) {
      console.error('\n✗ Error: No functions directory found');
      console.error('Looking for one of:');
      console.error('  - functions/');
      console.error('  - fn/');
      console.error('  - edge-functions/');
      console.error('  - api/functions/');
      console.error('  - serverless/functions/');
      console.error('\nCreate a functions directory with your edge function code to continue.');
      process.exit(1);
    }

    console.log(`Functions directory: ${functionsDir}`);

    // Get function entries
    console.log('\nScanning for functions...');
    const functionEntries = getFunctionEntries(functionsDir);

    if (functionEntries.length === 0) {
      console.error('\n✗ Error: No functions found in directory');
      console.error('\nFunctions should be structured as:');
      console.error('  functions/');
      console.error('    my-function/');
      console.error('      index.ts  (or index.js)');
      console.error('\nOr as single files:');
      console.error('  functions/');
      console.error('    my-function.ts');
      process.exit(1);
    }

    console.log(`Found ${functionEntries.length} function(s):`);
    functionEntries.forEach((fn) => console.log(`  - ${fn}`));

    // Deploy specific function or all functions
    const functionsToDeploy = functionName
      ? functionEntries.filter((fn) => fn === functionName)
      : functionEntries;

    if (functionsToDeploy.length === 0) {
      console.error(`\n✗ Error: Function '${functionName}' not found`);
      console.error('Available functions:');
      functionEntries.forEach((fn) => console.error(`  - ${fn}`));
      process.exit(1);
    }

    // Deploy each function
    console.log('\nDeploying functions...\n');

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    for (const func of functionsToDeploy) {
      console.log(`Deploying: ${func}...`);

      try {
        const source = getFunctionSource(functionsDir, func);
        const response = await apiClient.deployFunction(projectConfig.project_id, {
          function_name: func,
          source,
        });

        console.log(`  ✓ ${func} deployed successfully!`);
        console.log(`    ID: ${response.function_id}`);
        console.log(`    URL: ${response.url}`);
        console.log(`    Version: ${response.version}`);
        console.log(`    Status: ${response.status}`);

        results.push({ name: func, success: true });
      } catch (error) {
        const errorMsg = error instanceof ApiError ? error.message : String(error);
        console.error(`  ✗ ${func} failed: ${errorMsg}`);
        results.push({ name: func, success: false, error: errorMsg });
      }

      console.log('');
    }

    // Summary
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log('Deployment Summary:');
    console.log(`  ✓ Deployed: ${succeeded}`);
    if (failed > 0) {
      console.log(`  ✗ Failed: ${failed}`);
    }

    if (failed === results.length) {
      console.error('\n✗ All deployments failed');
      process.exit(1);
    } else if (failed > 0) {
      console.log('\n⚠ Some deployments failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✓ All functions deployed successfully!');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 403) {
        console.error('You do not have permission to deploy functions.');
      } else if (error.statusCode === 404) {
        console.error('Project not found or functions not enabled.');
      }
    } else {
      console.error('\n✗ Deployment failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
