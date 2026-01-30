import { apiClient, ApiError } from '../../lib/api-client';
import type { Project } from '../../lib/api-client';

function formatProject(project: Project, isLinked: boolean): string {
  const linkedIndicator = isLinked ? ' (linked)' : '';
  return `  ${project.id.slice(0, 8)} - ${project.name}${linkedIndicator}
      Slug: ${project.slug}
      Status: ${project.status}
      Created: ${new Date(project.created_at).toLocaleDateString()}`;
}

export async function projectList(): Promise<void> {
  try {
    // Check if user is authenticated
    if (!apiClient.isAuthenticated()) {
      console.error('\n✗ Error: Not authenticated');
      console.error('Please login first with: nextmavens login');
      process.exit(1);
    }

    console.log('\nFetching projects...');

    const projects = await apiClient.listProjects();

    // Get currently linked project ID
    const linkedProjectId = apiClient.getAuthToken() ? await getLinkedProjectId() : null;

    console.log('\nYour Projects:');
    console.log('-------------');

    if (projects.length === 0) {
      console.log('No projects found.');
      console.log('Create a project with: nextmavens project create <name>');
    } else {
      projects.forEach(project => {
        const isLinked = project.id === linkedProjectId;
        console.log(formatProject(project, isLinked));
      });
    }

    console.log(`\nTotal: ${projects.length} project${projects.length === 1 ? '' : 's'}`);

  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      }
    } else {
      console.error('\n✗ Failed to list projects:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

async function getLinkedProjectId(): Promise<string | null> {
  const fs = await import('fs');
  const path = await import('path');

  const localConfigPath = path.join(process.cwd(), '.nextmavens', 'config.json');

  if (!fs.existsSync(localConfigPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(localConfigPath, 'utf-8');
    const config = JSON.parse(data);
    return config.project_id || null;
  } catch {
    return null;
  }
}
