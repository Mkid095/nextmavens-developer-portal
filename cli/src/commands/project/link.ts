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

export async function projectLink(projectIdOrSlug?: string): Promise<void> {
  try {
    // Check if user is authenticated
    if (!apiClient.isAuthenticated()) {
      console.error('\n✗ Error: Not authenticated');
      console.error('Please login first with: nextmavens login');
      process.exit(1);
    }

    // Check if already linked
    const existingConfig = readLocalProjectConfig();
    if (existingConfig) {
      console.log('\n⚠ Warning: This directory is already linked to a project.');
      console.log(`Current: ${existingConfig.project_name} (${existingConfig.slug})`);
      const confirm = await question('Do you want to link to a different project? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    }

    let targetProjectId = projectIdOrSlug;

    // If no project ID/slug provided, show list and prompt
    if (!targetProjectId) {
      console.log('\nFetching your projects...');
      const projects = await apiClient.listProjects();

      if (projects.length === 0) {
        console.log('\nNo projects found.');
        console.log('Create a project with: nextmavens project create <name>');
        process.exit(1);
      }

      console.log('\nYour Projects:');
      console.log('-------------');
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (${project.slug})`);
        console.log(`     ID: ${project.id}`);
        console.log(`     Status: ${project.status}`);
      });

      const selection = await question('\nEnter project number or ID/slug to link: ');

      // Check if input is a number
      const index = parseInt(selection, 10);
      if (!isNaN(index) && index >= 1 && index <= projects.length) {
        targetProjectId = projects[index - 1].id;
      } else {
        targetProjectId = selection;
      }
    }

    // Find project by ID or slug
    console.log('\nFetching project details...');
    const projects = await apiClient.listProjects();
    const project = projects.find(p => p.id === targetProjectId || p.slug === targetProjectId);

    if (!project) {
      console.error(`\n✗ Error: Project not found: ${targetProjectId}`);
      console.error('Use "nextmavens project list" to see your projects.');
      process.exit(1);
    }

    // Write local config
    const localConfig: LocalProjectConfig = {
      project_id: project.id,
      project_name: project.name,
      slug: project.slug,
    };
    writeLocalProjectConfig(localConfig);

    console.log('\n✓ Project linked successfully!');
    console.log(`Name: ${project.name}`);
    console.log(`Slug: ${project.slug}`);
    console.log(`ID: ${project.id}`);
    console.log(`Config file: ${getLocalProjectConfigPath()}`);
    console.log('\nYou can now use other project commands in this directory.');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      }
    } else {
      console.error('\n✗ Failed to link project:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
