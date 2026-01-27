const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// Configuration
const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'nextmavens-portal-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'nextmavens-refresh-secret';

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens',
  max: 20
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Helper functions
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function generateApiKey(type = 'public') {
  const prefix = type === 'public' ? 'nm_live_pk_' : 'nm_live_sk_';
  const key = crypto.randomBytes(32).toString('hex');
  return `${prefix}${key}`;
}

function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Auth middleware
function authenticateDeveloper(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.developer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'developer-portal',
    timestamp: new Date().toISOString()
  });
});

// ============ DEVELOPER AUTHENTICATION ============

// Register developer
app.post('/api/developer/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('organization').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, organization } = req.body;

  try {
    // Check if developer exists
    const existingDeveloper = await pgPool.query(
      'SELECT id FROM developers WHERE email = $1',
      [email]
    );

    if (existingDeveloper.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create developer
    const result = await pgPool.query(`
      INSERT INTO developers (email, password_hash, name, organization)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, organization, created_at
    `, [email, passwordHash, name, organization]);

    const developer = result.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { id: developer.id, email: developer.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: developer.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      developer: {
        id: developer.id,
        email: developer.email,
        name: developer.name,
        organization: developer.organization
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('[Developer Portal] Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login developer
app.post('/api/developer/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await pgPool.query(
      'SELECT * FROM developers WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const developer = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, developer.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: developer.id, email: developer.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: developer.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      developer: {
        id: developer.id,
        email: developer.email,
        name: developer.name,
        organization: developer.organization
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('[Developer Portal] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current developer
app.get('/api/developer/me', authenticateDeveloper, async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT id, email, name, organization, created_at FROM developers WHERE id = $1',
      [req.developer.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Developer not found' });
    }

    res.json({ developer: result.rows[0] });
  } catch (error) {
    console.error('[Developer Portal] Get developer error:', error);
    res.status(500).json({ error: 'Failed to get developer' });
  }
});

// ============ PROJECTS ============

// Create project
app.post('/api/projects', authenticateDeveloper, [
  body('project_name').trim().isLength({ min: 2, max: 100 }),
  body('webhook_url').optional().isURL(),
  body('allowed_origins').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { project_name, webhook_url, allowed_origins } = req.body;
  const developerId = req.developer.id;

  try {
    // Generate slug
    const slug = generateSlug(project_name);

    // Create tenant
    const tenantResult = await pgPool.query(`
      INSERT INTO tenants (name, slug, settings)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [project_name, slug, {}]);

    const tenantId = tenantResult.rows[0].id;

    // Generate API keys
    const publicKey = generateApiKey('public');
    const secretKey = generateApiKey('secret');

    // Create project
    const projectResult = await pgPool.query(`
      INSERT INTO projects (
        developer_id,
        project_name,
        tenant_id,
        webhook_url,
        allowed_origins,
        rate_limit
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_name, tenant_id, created_at
    `, [developerId, project_name, tenantId, webhook_url, allowed_origins, 1000]);

    const project = projectResult.rows[0];

    // Create API keys
    await pgPool.query(`
      INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes)
      VALUES ($1, 'public', $2, $3, $4)
    `, [project.id, 'nm_live_pk_', hashApiKey(publicKey), ['read']]);

    await pgPool.query(`
      INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes)
      VALUES ($1, 'secret', $2, $3, $4)
    `, [project.id, 'nm_live_sk_', hashApiKey(secretKey), ['read', 'write']]);

    res.status(201).json({
      project: {
        id: project.id,
        project_name: project.project_name,
        tenant_id: project.tenant_id,
        created_at: project.created_at
      },
      api_keys: {
        public_key: publicKey,
        secret_key: secretKey
      },
      endpoints: {
        gateway: 'https://api.nextmavens.cloud',
        auth: 'https://auth.nextmavens.cloud',
        graphql: 'https://graphql.nextmavens.cloud',
        rest: 'https://api.nextmavens.cloud',
        realtime: 'wss://realtime.nextmavens.cloud',
        storage: 'https://telegram.nextmavens.cloud'
      },
      database_url: `postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens?options=--search_path=tenant_${slug}`,
      warning: 'Save your API keys now! You won\'t be able to see the secret key again.'
    });
  } catch (error) {
    console.error('[Developer Portal] Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List projects
app.get('/api/projects', authenticateDeveloper, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        p.id,
        p.project_name,
        p.tenant_id,
        p.webhook_url,
        p.allowed_origins,
        p.rate_limit,
        p.created_at,
        t.slug as tenant_slug,
        COUNT(DISTINCT ak.id) as api_keys_count
      FROM projects p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN api_keys ak ON p.id = ak.project_id
      WHERE p.developer_id = $1
      GROUP BY p.id, t.slug
      ORDER BY p.created_at DESC
    `, [req.developer.id]);

    res.json({ projects: result.rows });
  } catch (error) {
    console.error('[Developer Portal] List projects error:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Get project details
app.get('/api/projects/:id', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pgPool.query(`
      SELECT
        p.*,
        t.slug as tenant_slug,
        t.name as tenant_name
      FROM projects p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = $1 AND p.developer_id = $2
    `, [id, req.developer.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('[Developer Portal] Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// ============ API KEYS ============

// List API keys for a project
app.get('/api/projects/:id/keys', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify project ownership
    const project = await pgPool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pgPool.query(`
      SELECT
        id,
        key_type,
        key_prefix,
        scopes,
        rate_limit,
        last_used,
        created_at
      FROM api_keys
      WHERE project_id = $1 AND revoked_at IS NULL
      ORDER BY created_at DESC
    `, [id]);

    res.json({ api_keys: result.rows });
  } catch (error) {
    console.error('[Developer Portal] List API keys error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// Create new API key
app.post('/api/projects/:id/keys', authenticateDeveloper, [
  body('key_type').isIn(['public', 'secret']),
  body('scopes').optional().isArray(),
  body('rate_limit').optional().isInt({ min: 1, max: 10000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { key_type, scopes, rate_limit } = req.body;

  try {
    // Verify project ownership
    const project = await pgPool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate API key
    const apiKey = generateApiKey(key_type);
    const defaultScopes = scopes || (key_type === 'public' ? ['read'] : ['read', 'write']);

    const result = await pgPool.query(`
      INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes, rate_limit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, key_type, key_prefix, scopes, created_at
    `, [id, key_type, key_type === 'public' ? 'nm_live_pk_' : 'nm_live_sk_', hashApiKey(apiKey), defaultScopes, rate_limit]);

    res.status(201).json({
      api_key: {
        ...result.rows[0],
        key: apiKey // Only show once!
      },
      warning: 'Save this API key now! You won\'t be able to see it again.'
    });
  } catch (error) {
    console.error('[Developer Portal] Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Revoke API key
app.delete('/api/keys/:id', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify ownership through project
    const result = await pgPool.query(`
      UPDATE api_keys
      SET revoked_at = NOW()
      WHERE id = $1
        AND project_id IN (SELECT id FROM projects WHERE developer_id = $2)
      RETURNING id
    `, [id, req.developer.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('[Developer Portal] Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ============ STATISTICS ============

// Get project statistics
app.get('/api/projects/:id/stats', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify project ownership
    const project = await pgPool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get request stats
    const stats = await pgPool.query(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_requests,
        AVG(duration_ms) as avg_duration,
        MAX(created_at) as last_request
      FROM gateway_logs
      WHERE project_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
    `, [id]);

    // Get request breakdown by date
    const byDate = await pgPool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests
      FROM gateway_logs
      WHERE project_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [id]);

    // Get top paths
    const topPaths = await pgPool.query(`
      SELECT
        path,
        COUNT(*) as requests,
        AVG(duration_ms) as avg_duration
      FROM gateway_logs
      WHERE project_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY path
      ORDER BY requests DESC
      LIMIT 10
    `, [id]);

    res.json({
      stats: stats.rows[0],
      by_date: byDate.rows,
      top_paths: topPaths.rows
    });
  } catch (error) {
    console.error('[Developer Portal] Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get developer dashboard stats
app.get('/api/developer/dashboard', authenticateDeveloper, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        (SELECT COUNT(*) FROM projects WHERE developer_id = $1) as total_projects,
        (SELECT COUNT(*) FROM api_keys
         WHERE project_id IN (SELECT id FROM projects WHERE developer_id = $1)
           AND revoked_at IS NULL) as active_api_keys,
        (SELECT COUNT(*) FROM gateway_logs
         WHERE project_id IN (SELECT id FROM projects WHERE developer_id = $1)
           AND created_at > NOW() - INTERVAL '30 days') as total_requests_30d,
        (SELECT COUNT(DISTINCT DATE(created_at)) FROM gateway_logs
         WHERE project_id IN (SELECT id FROM projects WHERE developer_id = $1)
           AND created_at > NOW() - INTERVAL '30 days') as active_days_30d
    `, [req.developer.id]);

    res.json({ dashboard: result.rows[0] });
  } catch (error) {
    console.error('[Developer Portal] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// ============ DATABASE SCHEMA ============

// Get database schema for a project
app.get('/api/projects/:id/schema', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Get tenant_id for project
    const project = await pgPool.query(
      'SELECT tenant_id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // For now, return basic tables info
    const tables = await pgPool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'tenants')
      ORDER BY table_name, ordinal_position
    `);

    const groupedTables = {};
    tables.rows.forEach(row => {
      if (!groupedTables[row.table_name]) {
        groupedTables[row.table_name] = { columns: [] };
      }
      groupedTables[row.table_name].columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      });
    });

    res.json({ schema: groupedTables });
  } catch (error) {
    console.error('[Developer Portal] Schema error:', error);
    res.status(500).json({ error: 'Failed to get schema' });
  }
});

// ============ SERVICES MANAGEMENT ============

// Get available services
app.get('/api/services', authenticateDeveloper, async (req, res) => {
  try {
    const services = [
      {
        id: 'database',
        name: 'Database',
        description: 'PostgreSQL database with auto-generated REST & GraphQL APIs',
        icon: 'database',
        status: 'active',
        features: ['PostgREST API', 'GraphQL API', 'Row-Level Security', 'Multi-tenant'],
        endpoints: {
          rest: 'https://api.nextmavens.cloud',
          graphql: 'https://graphql.nextmavens.cloud'
        }
      },
      {
        id: 'auth',
        name: 'Authentication',
        description: 'JWT-based authentication with user management',
        icon: 'shield',
        status: 'active',
        features: ['JWT Tokens', 'User Registration', 'Password Reset', 'Social Auth'],
        endpoints: {
          auth: 'https://auth.nextmavens.cloud'
        }
      },
      {
        id: 'realtime',
        name: 'Realtime',
        description: 'WebSocket subscriptions for live database updates',
        icon: 'zap',
        status: 'active',
        features: ['WebSocket', 'Live Updates', 'Event Filtering', 'Auto-reconnect'],
        endpoints: {
          websocket: 'wss://realtime.nextmavens.cloud'
        }
      },
      {
        id: 'storage',
        name: 'Storage',
        description: 'File storage via Telegram integration',
        icon: 'folder',
        status: 'active',
        features: ['File Upload', 'CDN', 'Telegram Integration', 'Multiple File Types'],
        endpoints: {
          storage: 'https://telegram.nextmavens.cloud'
        }
      },
      {
        id: 'mcp',
        name: 'MCP Server',
        description: 'Model Context Protocol server for AI/IDE integration',
        icon: 'cpu',
        status: 'active',
        features: ['Claude Integration', 'ChatGPT Integration', 'Database Tools', 'Auth Tools'],
        endpoints: {
          npm: 'https://github.com/Mkid095/nextmavens-mcp-server'
        }
      }
    ];

    res.json({ services });
  } catch (error) {
    console.error('[Developer Portal] Services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Get service-specific API keys for a project
app.get('/api/projects/:id/service-keys', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify project ownership
    const project = await pgPool.query(
      'SELECT id, project_name, tenant_id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get API keys grouped by service
    const keys = await pgPool.query(`
      SELECT
        id,
        key_type,
        key_prefix,
        scopes,
        created_at,
        last_used_at,
        revoked_at
      FROM api_keys
      WHERE project_id = $1
        AND revoked_at IS NULL
      ORDER BY created_at DESC
    `, [id]);

    // Group keys by type
    const groupedKeys = {
      database: keys.rows.filter(k => k.scopes.includes('database')),
      auth: keys.rows.filter(k => k.scopes.includes('auth')),
      realtime: keys.rows.filter(k => k.scopes.includes('realtime')),
      storage: keys.rows.filter(k => k.scopes.includes('storage')),
      mcp: keys.rows.filter(k => k.scopes.includes('mcp')),
      general: keys.rows.filter(k => !k.scopes.some(s => ['database', 'auth', 'realtime', 'storage', 'mcp'].includes(s)))
    };

    res.json({
      project: project.rows[0],
      keys: groupedKeys,
      total_keys: keys.rows.length
    });
  } catch (error) {
    console.error('[Developer Portal] Service keys error:', error);
    res.status(500).json({ error: 'Failed to get service keys' });
  }
});

// Create service-specific API key
app.post('/api/projects/:id/service-keys', authenticateDeveloper, [
  body('service').isIn(['database', 'auth', 'realtime', 'storage', 'mcp', 'general']),
  body('key_type').isIn(['public', 'secret']),
  body('name').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { service, key_type, name } = req.body;

  try {
    // Verify project ownership
    const project = await pgPool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [id, req.developer.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate API key
    const servicePrefix = service === 'general' ? 'nm_live' : `nm_${service.substring(0, 2)}_`;
    const keyPrefix = `${servicePrefix}_${key_type === 'public' ? 'pk' : 'sk'}_`;
    const keyValue = crypto.randomBytes(32).toString('hex');
    const fullKey = `${keyPrefix}${keyValue}`;

    // Determine scopes based on service
    const scopes = service === 'general'
      ? (key_type === 'public' ? ['read'] : ['read', 'write'])
      : [service, key_type === 'secret' ? 'write' : 'read'];

    const result = await pgPool.query(`
      INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes, name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, key_type, key_prefix, scopes, name, created_at
    `, [id, key_type, keyPrefix, hashApiKey(fullKey), scopes, name || `${service} ${key_type} key`]);

    res.status(201).json({
      api_key: {
        ...result.rows[0],
        key: fullKey, // Only show once!
        service
      },
      warning: 'Save this API key now! You won\'t be able to see it again.'
    });
  } catch (error) {
    console.error('[Developer Portal] Create service key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Revoke API key
app.delete('/api/keys/:keyId', authenticateDeveloper, async (req, res) => {
  const { keyId } = req.params;

  try {
    // Verify key belongs to developer's project
    const result = await pgPool.query(`
      UPDATE api_keys
      SET revoked_at = NOW()
      WHERE id = $1
        AND project_id IN (SELECT id FROM projects WHERE developer_id = $2)
      RETURNING id
    `, [keyId, req.developer.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ revoked: true });
  } catch (error) {
    console.error('[Developer Portal] Revoke key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Get service usage stats
app.get('/api/projects/:id/service-stats', authenticateDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // Get request breakdown by service
    const byService = await pgPool.query(`
      SELECT
        CASE
          WHEN path LIKE '/api/auth%' THEN 'auth'
          WHEN path LIKE '/api/files%' THEN 'storage'
          WHEN path ~ '^/api/[^/]+$' THEN 'database'
          ELSE 'other'
        END as service,
        COUNT(*) as requests,
        AVG(duration_ms) as avg_duration
      FROM gateway_logs
      WHERE project_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY service
      ORDER BY requests DESC
    `, [id]);

    res.json({
      stats: byService.rows,
      period: '30 days'
    });
  } catch (error) {
    console.error('[Developer Portal] Service stats error:', error);
    res.status(500).json({ error: 'Failed to get service stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           NextMavens Developer Portal                         ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
║  Status: Running                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, pgPool };
