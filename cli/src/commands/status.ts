import { apiClient, ApiError, type ProjectStatusResponse } from '../lib/api-client';
import * as fs from 'fs';
import * as path from 'path';

function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return '●';
    case 'suspended':
      return '⊘';
    case 'archived':
      return '◌';
    case 'deleted':
      return '✕';
    default:
      return '○';
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'green';
    case 'suspended':
      return 'yellow';
    case 'archived':
      return 'blue';
    case 'deleted':
      return 'red';
    default:
      return 'gray';
  }
}

function getServiceIcon(enabled: boolean): string {
  return enabled ? '✓' : '✗';
}

function formatIssue(issue: { type: string; message: string; timestamp?: string }): string {
  const icon = issue.type === 'error' ? '✗' : '⚠';
  const time = issue.timestamp ? new Date(issue.timestamp).toLocaleString() : 'Now';
  return `  ${icon} ${issue.type.toUpperCase()}: ${issue.message}\n    Time: ${time}`;
}

function formatUsage(label: string, current: number | undefined, limit: number | undefined): string {
  if (current === undefined || limit === undefined) {
    return `    ${label}: N/A`;
  }
  const percentage = Math.round((current / limit) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  let color = 'green';
  if (percentage >= 90) color = 'red';
  else if (percentage >= 75) color = 'yellow';

  return `    ${label}: ${current.toLocaleString()} / ${limit.toLocaleString()} (${percentage}%)`;
}

async function getLinkedProjectId(): Promise<string | null> {
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

async function getLocalProjectName(): Promise<string | null> {
  const localConfigPath = path.join(process.cwd(), '.nextmavens', 'config.json');

  if (!fs.existsSync(localConfigPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(localConfigPath, 'utf-8');
    const config = JSON.parse(data);
    return config.project_name || null;
  } catch {
    return null;
  }
}

export async function statusCommand(): Promise<void> {
  try {
    // Check if user is authenticated
    if (!apiClient.isAuthenticated()) {
      console.error('\n✗ Error: Not authenticated');
      console.error('Please login first with: nextmavens login');
      process.exit(1);
    }

    // Get linked project ID
    const projectId = await getLinkedProjectId();

    if (!projectId) {
      console.error('\n✗ Error: No project linked');
      console.error('Link a project first with: nextmavens project link <id|slug>');
      console.error('Or create a new project with: nextmavens project create <name>');
      process.exit(1);
    }

    console.log('\nFetching project status...');

    // Get project status from API
    const status = await apiClient.getProjectStatus(projectId);

    console.log('\n' + '='.repeat(60));
    console.log('PROJECT STATUS');
    console.log('='.repeat(60));

    // Project Information
    console.log('\n📋 Project Information:');
    console.log(`  ${getStatusIcon(status.project.status)} Name: ${status.project.name}`);
    console.log(`    Slug: ${status.project.slug}`);
    console.log(`    ID: ${status.project.id.slice(0, 8)}...`);
    console.log(`    Status: ${status.project.status.toUpperCase()}`);
    console.log(`    Tenant ID: ${status.project.tenant_id.slice(0, 8)}...`);
    console.log(`    Created: ${new Date(status.project.created_at).toLocaleDateString()}`);

    // Services Status
    console.log('\n🔧 Enabled Services:');
    console.log(`    ${getServiceIcon(status.services.database)} Database`);
    console.log(`    ${getServiceIcon(status.services.auth)} Authentication`);
    console.log(`    ${getServiceIcon(status.services.realtime)} Realtime`);
    console.log(`    ${getServiceIcon(status.services.storage)} Storage`);
    console.log(`    ${getServiceIcon(status.services.functions)} Functions`);

    // Usage Metrics
    console.log('\n📊 Usage Metrics:');
    console.log(formatUsage('DB Queries', status.usage.db_queries, status.usage.db_queries_limit));
    console.log(formatUsage('Realtime Connections', status.usage.realtime_connections, status.usage.realtime_connections_limit));
    console.log(formatUsage('Storage Uploads', status.usage.storage_uploads, status.usage.storage_uploads_limit));
    console.log(formatUsage('Function Invocations', status.usage.function_invocations, status.usage.function_invocations_limit));

    // Issues and Warnings
    if (status.issues.length > 0) {
      console.log('\n⚠️  Issues & Warnings:');
      status.issues.forEach(issue => {
        console.log(formatIssue(issue));
      });
    }

    console.log('\n' + '='.repeat(60));

    // Show helpful messages based on status
    if (status.project.status.toLowerCase() === 'suspended') {
      console.log('\n⚠️  This project is suspended. Contact support for assistance.');
    } else if (status.project.status.toLowerCase() === 'archived') {
      console.log('\n📦 This project is archived. Reactivate it to restore services.');
    }

    // Check for approaching limits
    const checkLimit = (current: number | undefined, limit: number | undefined, name: string): boolean => {
      if (current === undefined || limit === undefined) return false;
      const percentage = (current / limit) * 100;
      if (percentage >= 90) {
        console.log(`\n⚠️  WARNING: ${name} at ${percentage.toFixed(0)}% capacity!`);
        return true;
      } else if (percentage >= 75) {
        console.log(`\n📌 NOTICE: ${name} at ${percentage.toFixed(0)}% capacity`);
        return true;
      }
      return false;
    };

    let hasWarnings = false;
    hasWarnings = checkLimit(status.usage.db_queries, status.usage.db_queries_limit, 'DB Queries') || hasWarnings;
    hasWarnings = checkLimit(status.usage.realtime_connections, status.usage.realtime_connections_limit, 'Realtime Connections') || hasWarnings;
    hasWarnings = checkLimit(status.usage.storage_uploads, status.usage.storage_uploads_limit, 'Storage Uploads') || hasWarnings;
    hasWarnings = checkLimit(status.usage.function_invocations, status.usage.function_invocations_limit, 'Function Invocations') || hasWarnings;

    if (!hasWarnings && status.issues.length === 0 && status.project.status.toLowerCase() === 'active') {
      console.log('\n✓ Everything looks good!');
    }

    console.log('');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Your session may have expired. Please login again.');
      } else if (error.statusCode === 404) {
        console.error('Project not found. It may have been deleted or you may not have access.');
      }
    } else {
      console.error('\n✗ Failed to fetch project status:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
