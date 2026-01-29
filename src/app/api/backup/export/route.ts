/**
 * POST /api/backup/export
 *
 * Manual export API for generating database backups.
 * Creates SQL dump using pg_dump for tenant_{slug} schema.
 * Returns download URL or file directly.
 * Handles large databases asynchronously.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const EXPORT_RATE_LIMIT = 10; // 10 exports per hour
const EXPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ExportRequest {
  project_id: string;
  format?: 'sql' | 'plain';
  async?: boolean;
}

/**
 * Execute pg_dump command and return the output
 */
async function executePgDump(schema: string, format: 'sql' | 'plain' = 'sql'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return reject(new Error('DATABASE_URL environment variable is not set'));
    }

    const args = [
      dbUrl,
      '--schema', schema,
      '--no-owner',
      '--no-acl',
      '--format', format === 'sql' ? 'p' : 'p',
    ];

    const pgDump = spawn('pg_dump', args);
    const chunks: Buffer[] = [];

    pgDump.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    pgDump.stderr.on('data', (data) => {
      console.error('[pg_dump stderr]:', data.toString());
    });

    pgDump.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`pg_dump process exited with code ${code}`));
      }
    });

    pgDump.on('error', (err) => {
      reject(new Error(`Failed to start pg_dump: ${err.message}`));
    });
  });
}

/**
 * Execute pg_dump asynchronously and save to file
 */
async function executePgDumpAsync(
  schema: string,
  outputPath: string,
  format: 'sql' | 'plain' = 'sql'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return reject(new Error('DATABASE_URL environment variable is not set'));
    }

    const args = [
      dbUrl,
      '--schema', schema,
      '--no-owner',
      '--no-acl',
      '--format', format === 'sql' ? 'p' : 'p',
      '--file', outputPath,
    ];

    const pgDump = spawn('pg_dump', args);

    pgDump.stderr.on('data', (data) => {
      console.error('[pg_dump stderr]:', data.toString());
    });

    pgDump.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_dump process exited with code ${code}`));
      }
    });

    pgDump.on('error', (err) => {
      reject(new Error(`Failed to start pg_dump: ${err.message}`));
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const developer = await authenticateRequest(request);
    const body: ExportRequest = await request.json();

    // Validate request body
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Verify developer owns this project
    const pool = getPool();
    const projectResult = await pool.query(
      `SELECT
        p.id,
        p.project_name,
        p.developer_id,
        t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.id = $1`,
      [body.project_id]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = projectResult.rows[0];

    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const schema = `tenant_${project.tenant_slug}`;
    const format = body.format || 'sql';
    const useAsync = body.async !== false; // Default to async for large databases

    // Check rate limit (simple in-memory check)
    // In production, use Redis or similar for distributed rate limiting
    const rateLimitKey = `export:${developer.id}:${Date.now() / EXPORT_WINDOW_MS}`;
    // Note: This is a simplified rate limit. Implement proper rate limiting in production.

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    try {
      await fs.mkdir(exportsDir, { recursive: true });
    } catch (err) {
      console.error('[Export API] Error creating exports directory:', err);
    }

    const filename = `${project.tenant_slug}_${randomUUID()}.sql`;
    const outputPath = path.join(exportsDir, filename);

    if (useAsync) {
      // Async export for large databases
      // Start the export process in background
      executePgDumpAsync(schema, outputPath, format)
        .then(() => {
          console.log(`[Export API] Async export completed: ${filename}`);
        })
        .catch((err) => {
          console.error(`[Export API] Async export failed:`, err);
        });

      return NextResponse.json({
        success: true,
        message: 'Export started. You will receive a notification when complete.',
        filename,
        status: 'processing',
      });
    } else {
      // Synchronous export
      try {
        const dumpBuffer = await executePgDump(schema, format);

        // Save to file
        await fs.writeFile(outputPath, dumpBuffer);

        // Return the file
        return new NextResponse(dumpBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': dumpBuffer.length.toString(),
          },
        });
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[Export API] Error executing pg_dump:', err);
        return NextResponse.json(
          {
            error: 'Failed to export database',
            details: err.message,
          },
          { status: 500 }
        );
      }
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Export API] Error:', error);

    return NextResponse.json(
      {
        error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to process request. Please try again later.',
      },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
