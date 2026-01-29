import * as fs from 'fs';
import * as path from 'path';
import { apiClient, ApiError } from '../../lib/api-client';
import { config } from '../../lib/config';

const LOCAL_CONFIG_FILE = '.nextmavens';
const LOCAL_CONFIG_DIR = '.nextmavens';

interface LocalProjectConfig {
  project_id: string;
  project_name: string;
  slug: string;
}

function getLocalProjectConfigPath(): string {
  return path.join(process.cwd(), LOCAL_CONFIG_DIR, 'config.json');
}

function ensureLocalConfigDir(): void {
  const configDir = path.join(process.cwd(), LOCAL_CONFIG_DIR);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function writeLocalProjectConfig(projectConfig: LocalProjectConfig): void {
  ensureLocalConfigDir();
  const configPath = getLocalProjectConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');
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

export async function projectCreate(name: string): Promise<void> {
  try {
    if (!name || name.trim() === '') {
      console.error('\n✗ Error: Project name is required');
      console.error('Usage: nextmavens project create <name>');
      process.exit(1);
    }

    // Check if user is authenticated
    if (!apiClient.isAuthenticated()) {
      console.error('\n✗ Error: Not authenticated');
      console.error('Please login first with: nextmavens login');
      process.exit(1);
    }

    console.log(`\nCreating project: ${name}...`);

    const project = await apiClient.createProject(name.trim());

    console.log('\n✓ Project created successfully!');
    console.log(`ID: ${project.id}`);
    console.log(`Name: ${project.name}`);
    console.log(`Slug: ${project.slug}`);
    console.log(`Status: ${project.status}`);
    console.log(`Created: ${new Date(project.created_at).toLocaleString()}`);

    // Automatically link the project in the current directory
    const localConfig: LocalProjectConfig = {
      project_id: project.id,
      project_name: project.name,
      slug: project.slug,
    };
    writeLocalProjectConfig(localConfig);

    console.log('\n✓ Project linked to current directory');
    console.log(`Config file: ${getLocalProjectConfigPath()}`);
    console.log('\nYou can now use other project commands in this directory.');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 409) {
        console.error('A project with this name already exists.');
      }
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      }
    } else {
      console.error('\n✗ Failed to create project:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
