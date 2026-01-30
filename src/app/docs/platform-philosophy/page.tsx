'use client'

import Link from 'next/link'
import { ArrowLeft, Lightbulb, Database, CheckCircle, AlertCircle, Code, Zap, Shield, GitBranch, Radio, Stream, HardDrive, FolderOpen, Cloud, ImageIcon, Key, Lock, RefreshCw, Server, Wrench, Activity, BarChart3, Bot } from 'lucide-react'
import { motion } from 'framer-motion'

const principles = [
  {
    icon: Database,
    title: 'Postgres-Native',
    description: 'SQL-first architecture with direct database access',
    color: 'blue',
    comingSoon: false,
  },
  {
    icon: Zap,
    title: 'Realtime DB-Driven',
    description: 'Change Data Capture (CDC) powered subscriptions',
    color: 'emerald',
    comingSoon: false,
  },
  {
    icon: HardDrive,
    title: 'Storage Abstraction',
    description: 'Telegram for raw, Cloudinary for optimized',
    color: 'cyan',
    comingSoon: false,
  },
  {
    icon: Shield,
    title: 'JWT-First Auth',
    description: 'Stateless token-based authentication',
    color: 'purple',
    comingSoon: false,
  },
  {
    icon: GitBranch,
    title: 'Multi-Tenant by Default',
    description: 'Schema-based tenant isolation',
    color: 'orange',
    comingSoon: true,
  },
  {
    icon: AlertCircle,
    title: 'Security Principles',
    description: 'Fail closed, audit everything, zero trust',
    color: 'red',
    comingSoon: false,
  },
  {
    icon: Wrench,
    title: 'Operational Simplicity',
    description: 'Boring technology, minimal deps, observable by default',
    color: 'amber',
    comingSoon: false,
  },
  {
    icon: Code,
    title: 'API-First Design',
    description: 'CLI and automation are first-class citizens',
    color: 'teal',
    comingSoon: true,
  },
]

const realtimeBenefits = [
  {
    title: 'Subscriptions Follow Table Structure',
    description: 'Subscribe to any table directly. No custom protocols, no separate schema definitions. Your database structure drives your realtime subscriptions.',
    icon: Database,
    examples: [
      'Subscribe to: users, orders, messages, any table',
      'Filters use SQL WHERE clauses',
      'Schema-driven, not protocol-driven',
      'Works with existing database constraints',
    ],
  },
  {
    title: 'CDC-Based, Not Custom Protocol',
    description: 'Change Data Capture (CDC) using Postgres logical replication captures database changes at the source. Reliable, ordered, and efficient.',
    icon: Radio,
    examples: [
      'Captures INSERT, UPDATE, DELETE operations',
      'Real-time streaming via logical replication',
      'Efficient: only changed data transmitted',
      'Ordered delivery guarantees',
    ],
  },
  {
    title: 'Schema-Driven and Automatic',
    description: 'When you modify your schema, subscriptions automatically adapt. No manual configuration, no redeployment needed.',
    icon: Zap,
    examples: [
      'Automatic sync with database schema',
      'No separate subscription configuration',
      'Add/remove columns without breaking clients',
      'DDL changes propagate instantly',
    ],
  },
]

const realtimeComparison = [
  {
    approach: 'NextMavens DB-Driven',
    description: 'Postgres CDC → WebSocket',
    pros: [
      'Subscriptions map 1:1 to tables',
      'Use existing SQL knowledge',
      'Schema changes are automatic',
      'Ordered delivery guaranteed',
      'No duplicate state management',
    ],
  },
  {
    approach: 'Custom Pub/Sub',
    description: 'Application-level events → WebSocket',
    pros: [
      'Flexible event naming',
      'Business logic in events',
      'Language-agnostic',
      'Can work with any database',
    ],
  },
]

const postgresBenefits = [
  {
    title: 'SQL-First, Not ORM-First',
    description: 'Write raw SQL queries. No abstraction layers, no hidden magic, no learning custom query builders. Use the full power of PostgreSQL directly.',
    icon: Code,
    examples: [
      'Window functions and CTEs',
      'Full-text search with tsvector',
      'JSON/JSONB operators',
      'Custom aggregates and types',
    ],
  },
  {
    title: 'Direct Database Access',
    description: 'Connect directly to your Postgres database. Use psql, pgAdmin, DataGrip, or any Postgres client. Your data, your tools, full control.',
    icon: Database,
    examples: [
      'Standard PostgreSQL connection',
      'Use existing tooling ecosystem',
      'No proprietary protocols',
      'Full SQL feature support',
    ],
  },
  {
    title: 'Portability',
    description: 'Your skills and knowledge transfer. Standard SQL means your queries work across systems. No vendor lock-in, no learning curve.',
    icon: GitBranch,
    examples: [
      'Standard PostgreSQL syntax',
      'Migrate to self-hosted Postgres easily',
      'Re-use existing SQL knowledge',
      'Industry-standard protocols',
    ],
  },
  {
    title: 'Power & Familiarity',
    description: 'PostgreSQL is the world\'s most advanced open source database. Leverage 30+ years of development, documentation, and community knowledge.',
    icon: Zap,
    examples: [
      'Advanced indexing strategies',
      'Mature query optimizer',
      'Extensive ecosystem of extensions',
      'Proven at massive scale',
    ],
  },
]

const codeExamples = [
  {
    title: 'Full-Text Search',
    description: 'Use PostgreSQL\'s built-in full-text search capabilities',
    code: `-- Search with ranking
SELECT
  title,
  ts_rank(textsearchable_index_col, query) AS rank
FROM documents,
  to_tsquery('english', 'postgres & native') query
WHERE textsearchable_index_col @@ query
ORDER BY rank DESC;`,
  },
  {
    title: 'JSON Operations',
    description: 'Query and manipulate JSON data natively',
    code: `-- Extract nested JSON data
SELECT
  id,
  metadata->>'user_id' AS user_id,
  metadata->'settings'->>'theme' AS theme
FROM events
WHERE metadata->>'type' = 'click'
  AND CAST(metadata->'timestamp' AS BIGINT) > EXTRACT(EPOCH FROM NOW()) * 1000;`,
  },
  {
    title: 'Window Functions',
    description: 'Perform complex analytics with window functions',
    code: `-- Calculate running totals
SELECT
  date,
  revenue,
  SUM(revenue) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM daily_sales;`,
  },
  {
    title: 'Common Table Expressions',
    description: 'Build readable, maintainable complex queries',
    code: `-- Find users with above-average orders
WITH user_order_counts AS (
  SELECT
    user_id,
    COUNT(*) AS order_count
  FROM orders
  GROUP BY user_id
),
avg_orders AS (
  SELECT AVG(order_count) AS avg_count
  FROM user_order_counts
)
SELECT uoc.user_id
FROM user_order_counts uoc, avg_orders ao
WHERE uoc.order_count > ao.avg_count;`,
  },
]

const storageBenefits = [
  {
    title: 'Transparent Dual-Provider Strategy',
    description: 'Files automatically route to the best storage backend based on your use case. Raw files go to Telegram, optimized assets go to Cloudinary. No configuration needed.',
    icon: HardDrive,
    examples: [
      'Automatic backend selection',
      'Telegram for original/raw files',
      'Cloudinary for optimized/web-ready assets',
      'Unified API for all storage operations',
    ],
  },
  {
    title: 'Cost Optimization',
    description: 'Telegram provides generous free storage (up to 2GB per file) for raw files and backups. Cloudinary optimization reduces bandwidth costs for web delivery.',
    icon: Zap,
    examples: [
      'Telegram: Free storage up to 2GB/file',
      'Cloudinary: CDN delivery + optimization',
      'Automatic compression and format conversion',
      'Pay only for what you deliver to users',
    ],
  },
  {
    title: 'Performance Through CDN',
    description: 'Optimized assets are delivered through Cloudinary\'s global CDN. Raw files are served efficiently from Telegram\'s infrastructure.',
    icon: Cloud,
    examples: [
      'Global edge caching',
      'Automatic format selection (WebP/AVIF)',
      'Responsive image generation',
      'Video streaming optimization',
    ],
  },
  {
    title: 'Developer Simplicity',
    description: 'One API for all storage operations. Upload, list, delete—same interface whether the file lives on Telegram or Cloudinary.',
    icon: Code,
    examples: [
      'Single SDK for all storage operations',
      'Automatic URL generation',
      'Built-in transformation support',
      'No manual provider management',
    ],
  },
]

const storageUseCases = [
  {
    category: 'Use Telegram For',
    icon: FolderOpen,
    description: 'Raw file storage and long-term archiving',
    useCases: [
      'User-uploaded documents (PDFs, etc.)',
      'Database backups',
      'Log archives',
      'Large video files (>2GB)',
      'Original source files',
    ],
    color: 'blue',
  },
  {
    category: 'Use Cloudinary For',
    icon: ImageIcon,
    description: 'Optimized web assets and media delivery',
    useCases: [
      'User profile photos',
      'Product images for e-commerce',
      'Marketing banners and graphics',
      'Thumbnails and previews',
      'Responsive images',
    ],
    color: 'purple',
  },
]

const storageComparison = [
  {
    feature: 'Storage Cost',
    telegram: 'Free (up to 2GB/file)',
    cloudinary: 'Usage-based (with free tier)',
    telegramAdvantage: true,
  },
  {
    feature: 'Max File Size',
    telegram: '2GB',
    cloudinary: '100MB (free), larger plans',
    telegramAdvantage: true,
  },
  {
    feature: 'CDN Delivery',
    telegram: 'Limited',
    cloudinary: 'Global edge network',
    telegramAdvantage: false,
  },
  {
    feature: 'Image Optimization',
    telegram: 'None',
    cloudinary: 'Automatic (WebP, AVIF, etc.)',
    telegramAdvantage: false,
  },
  {
    feature: 'Transformations',
    telegram: 'None',
    cloudinary: 'On-the-fly (resize, crop, filter)',
    telegramAdvantage: false,
  },
  {
    feature: 'Use Case',
    telegram: 'Raw storage, backups, archives',
    cloudinary: 'Web assets, media delivery',
    telegramAdvantage: null,
  },
]

const jwtBenefits = [
  {
    title: 'Stateless Architecture',
    description: 'No server-side session storage. Each JWT contains all required information. Validated cryptographically, trusted inherently.',
    icon: Lock,
    examples: [
      'No session database required',
      'Scales horizontally without session sync',
      'Server can be truly stateless',
      'Reduced infrastructure complexity',
    ],
  },
  {
    title: 'Token-Based Auth Flow',
    description: 'Clients receive JWTs after authentication. Include tokens in request headers. Stateless validation on every request.',
    icon: Key,
    examples: [
      'Single token contains all claims',
      'Authorization: Bearer <token> header',
      'No cookie overhead or CSRF concerns',
      'Works across domains and services',
    ],
  },
  {
    title: 'Horizontal Scalability',
    description: 'Any server instance can validate any JWT. No sticky sessions needed. Load balance freely across your infrastructure.',
    icon: RefreshCw,
    examples: [
      'No session replication between servers',
      'Deploy without worrying about session affinity',
      'Serverless-friendly',
      'Simple auto-scaling',
    ],
  },
  {
    title: 'Cross-Service Compatibility',
    description: 'Same JWT works across multiple services. API, web, mobile—all share the same auth mechanism. Single source of truth.',
    icon: Server,
    examples: [
      'One token for web, mobile, and API',
      'Microservices share validation logic',
      'Standard OAuth 2.0 / OpenID Connect',
      'Easy third-party integrations',
    ],
  },
]

const jwtComparison = [
  {
    aspect: 'Server State',
    jwt: 'Stateless - no storage needed',
    session: 'Stateful - requires session store',
    jwtAdvantage: true,
  },
  {
    aspect: 'Scalability',
    jwt: 'Horizontal - any server handles requests',
    session: 'Limited - requires sticky sessions or replication',
    jwtAdvantage: true,
  },
  {
    aspect: 'Performance',
    jwt: 'Fast - crypto validation only',
    session: 'Slower - database lookup per request',
    jwtAdvantage: true,
  },
  {
    aspect: 'Revocation',
    jwt: 'Complex - requires token blocklist or short expiry',
    session: 'Simple - delete from session store',
    jwtAdvantage: false,
  },
  {
    aspect: 'Token Size',
    jwt: 'Larger - contains all claims',
    session: 'Smaller - just a session ID',
    jwtAdvantage: false,
  },
  {
    aspect: 'Cross-Domain',
    jwt: 'Easy - Authorization header',
    session: 'Complex - CORS and cookie restrictions',
    jwtAdvantage: true,
  },
]

const authFlowSteps = [
  {
    step: 1,
    title: 'Authenticate',
    description: 'User submits credentials (email/password, OAuth, etc.) to the authentication endpoint.',
    code: `POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "secure-password"
}`,
  },
  {
    step: 2,
    title: 'Receive JWT',
    description: 'Server validates credentials and returns a signed JWT containing user claims and metadata.',
    code: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}`,
  },
  {
    step: 3,
    title: 'Include in Requests',
    description: 'Client includes the JWT in the Authorization header for subsequent requests.',
    code: `GET /api/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
  },
  {
    step: 4,
    title: 'Validate & Process',
    description: 'Server validates JWT signature and claims. No database lookup needed for authentication.',
    code: `// Verify signature and extract claims
const claims = await verifyJWT(token)
// Claims: { userId: "usr_123", email: "...", exp: ... }`,
  },
]

const securityBenefits = [
  {
    title: 'Fail Closed, Not Open',
    description: 'When in doubt, deny access. Default deny policies require explicit authorization. Unknown inputs, missing permissions, or validation errors result in rejection, not fallback to permissive states.',
    icon: Shield,
    examples: [
      'API endpoints deny by default, require explicit auth',
      'Firewall rules block all traffic, whitelist allowed sources',
      'RBAC: no access unless permission explicitly granted',
      'Validation failures return 403, not proceed with defaults',
    ],
  },
  {
    title: 'Explicit Over Implicit',
    description: 'Make security decisions visible and intentional. No hidden permissions, no implicit access grants, no "it just works" magic that obscures who can do what.',
    icon: Code,
    examples: [
      'All permissions defined in code, not inferred',
      'Role requirements explicitly declared on endpoints',
      'No fallback permissions or implicit role inheritance',
      'Security decisions auditable from code review',
    ],
  },
  {
    title: 'Audit Everything',
    description: 'Every security-relevant action is logged. Authentication, authorization, data access, configuration changes—all recorded with actor, timestamp, and context.',
    icon: AlertCircle,
    examples: [
      'All auth events logged (login, logout, token refresh)',
      'Authorization failures logged with actor and resource',
      'Data access logged for sensitive operations',
      'Audit logs immutable and tamper-evident',
    ],
  },
  {
    title: 'Zero Trust by Default',
    description: 'Trust no request, regardless of source. Every request is authenticated, every authorization is checked, every input is validated. No trusted networks, no trusted clients.',
    icon: Lock,
    examples: [
      'All requests require valid authentication',
      'Internal services authenticate with each other',
      'Network segmentation: no trusted internal zones',
      'Input validation on all API boundaries',
    ],
  },
]

const securityExamples = [
  {
    title: 'Fail Closed API Endpoints',
    description: 'API endpoints require explicit authentication and authorization checks',
    code: `// Default deny: middleware rejects unauthenticated requests
export const withAuth = (handler: Handler) => async (req: Request) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await verifyJWT(token)
  if (!user) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  return handler(req, user)
}

// Explicit permission check
export const withPermission = (permission: Permission) => async (req: Request, user: User) => {
  if (!hasPermission(user, permission)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Proceed with request
}`,
  },
  {
    title: 'Explicit Authorization Declaration',
    description: 'Permissions are declared explicitly, not inferred from context',
    code: `// Route handlers declare required permissions explicitly
export const DELETE = withAuth(
  withPermission('projects.delete')(async (req, user) => {
    // User is authenticated AND has projects.delete permission
    // No implicit access, no role-based inference
    const project = await deleteProject(req.params.id)
    return Response.json(project)
  })
)

// Invalid: Implicit role-based access
export const DELETE = withAuth(async (req, user) => {
  if (user.role === 'admin') {  // Implicit, hard to audit
    await deleteProject(req.params.id)
  }
})`,
  },
  {
    title: 'Comprehensive Audit Logging',
    description: 'All security-relevant events are logged with full context',
    code: `// Audit log entry includes actor, action, target, context
await auditLog.insert({
  actor_id: user.id,
  actor_email: user.email,
  action: 'project.deleted',
  target_type: 'project',
  target_id: project.id,
  metadata: {
    project_name: project.name,
    deletion_reason: req.body.reason,
  },
  ip_address: req.ip,
  user_agent: req.headers.get('user-agent'),
  timestamp: new Date(),
  request_id: req.id,
})

// Authorization failures also logged
if (!hasPermission(user, 'projects.delete')) {
  await auditLog.insert({
    actor_id: user.id,
    action: 'authorization.denied',
    target_type: 'project',
    target_id: project.id,
    metadata: {
      required_permission: 'projects.delete',
      user_roles: user.roles,
    },
    timestamp: new Date(),
  })
}`,
  },
  {
    title: 'Zero Trust Network Segmentation',
    description: 'Internal services authenticate with each other, no trusted networks',
    code: `// Service-to-service authentication
const serviceToken = await getServiceToken('data-plane')
const response = await fetch('http://data-plane/internal/query', {
  headers: {
    'Authorization': \`Bearer \${serviceToken}\`,
    'X-Service-Name': 'api-gateway',
  },
})

// Mutual TLS between services
const httpsAgent = new https.Agent({
  cert: fs.readFileSync('/certs/service.crt'),
  key: fs.readFileSync('/certs/service.key'),
  ca: fs.readFileSync('/certs/ca.crt'),
  rejectUnauthorized: true,  // Fail closed: verify peer cert
})

// No trusted internal networks
// const isInternal = req.ip.startsWith('10.')  // WRONG
// if (isInternal) return Next()  // Trusts network, not service`,
  },
]

const securityAntiPatterns = [
  {
    pattern: 'Implicit Role-Based Access',
    problem: 'Inferring permissions from roles makes code hard to audit and introduces hidden access paths',
    solution: 'Declare required permissions explicitly on each endpoint',
    icon: AlertCircle,
  },
  {
    pattern: 'Fail Open Configuration',
    problem: 'Using default allow policies when security controls fail (e.g., auth service down)',
    solution: 'Always fail closed—return errors when security controls are unavailable',
    icon: Shield,
  },
  {
    pattern: 'Hidden Admin Bypasses',
    problem: 'Admin users bypassing all checks without audit trail or explicit permissions',
    solution: 'Admins require explicit permissions for all actions, with full audit logging',
    icon: Lock,
  },
  {
    pattern: 'Selective Audit Logging',
    problem: 'Only logging successful actions while ignoring failures and denied requests',
    solution: 'Log all security events: successes, failures, and denials with full context',
    icon: Code,
  },
]

export default function PlatformPhilosophyPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Lightbulb className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Platform Philosophy</h1>
            <p className="text-slate-600">The opinionated foundations that guide NextMavens</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Core Principles</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            NextMavens is built on opinionated technical choices that prioritize developer experience,
            operational simplicity, and long-term maintainability. These principles aren't just preferences—
            they're architectural decisions that affect every aspect of the platform.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                cyan: 'bg-cyan-100 text-cyan-700',
                purple: 'bg-purple-100 text-purple-700',
                orange: 'bg-orange-100 text-orange-700',
                red: 'bg-red-100 text-red-700',
                teal: 'bg-teal-100 text-teal-700',
                amber: 'bg-amber-100 text-amber-700',
              }[principle.color]

              return (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl border ${
                    principle.comingSoon
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{principle.title}</h3>
                        {principle.comingSoon && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{principle.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Postgres-Native Approach</h2>
              <p className="text-slate-600">Why SQL-first is the right foundation</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {postgresBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">PostgreSQL Features in Action</h3>
            <p className="text-slate-600 mb-8">
              These examples demonstrate the power of using PostgreSQL directly. No ORM limitations,
              no query builder quirks—just pure, standard SQL.
            </p>

            <div className="space-y-8">
              {codeExamples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-slate-900 mb-2">{example.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{example.description}</p>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed">
                  By embracing PostgreSQL as the primary interface, we avoid the complexity tax of ORM abstractions
                  while gaining access to decades of database innovation. Your queries are portable, your skills are
                  transferable, and your application can leverage the full power of one of the world's most advanced
                  database systems. This is Postgres-native development.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Stream className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Realtime DB-Driven Philosophy</h2>
              <p className="text-slate-600">Why database-driven subscriptions are the right approach</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {realtimeBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Comparison: DB-Driven vs Custom Protocol</h3>
            <p className="text-slate-600 mb-8">
              Understanding the trade-offs between database-driven realtime and custom pub/sub systems helps
              you make the right architectural decision for your application.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {realtimeComparison.map((approach, index) => (
                <motion.div
                  key={approach.approach}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-xl p-6 border ${
                    approach.approach === 'NextMavens DB-Driven'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {approach.approach === 'NextMavens DB-Driven' ? (
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Stream className="w-5 h-5 text-emerald-700" />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Code className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <h4 className="font-semibold text-slate-900">{approach.approach}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{approach.description}</p>
                  <ul className="space-y-2">
                    {approach.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          approach.approach === 'NextMavens DB-Driven' ? 'text-emerald-600' : 'text-slate-500'
                        }`} />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Why DB-Driven Realtime Wins</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Single Source of Truth</h4>
                  <p className="text-slate-600">
                    Your database schema is the only schema. No separate subscription definitions to maintain,
                    no sync issues between API and realtime layer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Automatic Schema Evolution</h4>
                  <p className="text-slate-600">
                    Add a column? Subscriptions see it instantly. Rename a table? No configuration change needed.
                    The database drives the realtime layer automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Built-in Reliability</h4>
                  <p className="text-slate-600">
                    Postgres logical replication provides ordered, at-least-once delivery guarantees.
                    No need to build your own message ordering or deduplication.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  By making subscriptions database-driven, we eliminate the complexity of custom pub/sub systems
                  while gaining automatic schema sync and built-in reliability. Your data model is your realtime
                  model—no translation layer needed.
                </p>
                <Link
                  href="/docs/realtime"
                  className="inline-flex items-center gap-2 text-emerald-700 font-medium hover:text-emerald-800"
                >
                  Explore Realtime Documentation
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <HardDrive className="w-6 h-6 text-cyan-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Storage Abstraction Strategy</h2>
              <p className="text-slate-600">Why transparent dual-provider storage is the smart choice</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {storageBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Icon className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">When to Use Which Provider</h3>
            <p className="text-slate-600 mb-8">
              Understanding the strengths of each provider helps you design optimal storage strategies for your application.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {storageUseCases.map((useCase) => {
                const Icon = useCase.icon
                return (
                  <motion.div
                    key={useCase.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-6 border ${
                      useCase.color === 'blue'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-purple-200 bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        useCase.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          useCase.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{useCase.category}</h4>
                        <p className="text-sm text-slate-600">{useCase.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {useCase.useCases.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            useCase.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                          }`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>

            <h4 className="text-lg font-semibold text-slate-900 mb-4">Feature Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Feature</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-blue-700">Telegram (Raw)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-purple-700">Cloudinary (Optimized)</th>
                  </tr>
                </thead>
                <tbody>
                  {storageComparison.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-700 font-medium">{row.feature}</td>
                      <td className={`py-3 px-4 text-sm ${row.telegramAdvantage === true ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                        {row.telegram}
                      </td>
                      <td className={`py-3 px-4 text-sm ${row.telegramAdvantage === false ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                        {row.cloudinary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">How It Works</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Upload via Unified API</h4>
                  <p className="text-slate-600">
                    Use a single upload endpoint regardless of destination. The platform intelligently routes files
                    based on type, size, and optimization needs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Automatic Backend Selection</h4>
                  <p className="text-slate-600">
                    Raw files (documents, backups, archives) route to Telegram. Images and media files route to
                    Cloudinary for automatic optimization.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Single URL Reference</h4>
                  <p className="text-slate-600">
                    Get one URL that works forever. The abstraction layer handles serving from the correct backend,
                    applying transformations when needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Transparent Delivery</h4>
                  <p className="text-slate-600">
                    End users receive optimized assets via CDN. Backups and archives are accessible when needed.
                    You don't manage the complexity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 rounded-xl p-8 border border-cyan-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  By combining Telegram's generous free storage with Cloudinary's optimization and CDN, we get the
                  best of both worlds: low-cost raw storage and high-performance web delivery. The abstraction is
                  transparent—you upload files, we handle the rest. No manual provider management, no complex routing
                  logic, just storage that works.
                </p>
                <Link
                  href="/docs/storage"
                  className="inline-flex items-center gap-2 text-cyan-700 font-medium hover:text-cyan-800"
                >
                  Explore Storage Documentation
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Shield className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">JWT-First Authentication</h2>
              <p className="text-slate-600">Why stateless token-based auth is the modern standard</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {jwtBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Icon className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">JWT vs Session-Based Authentication</h3>
            <p className="text-slate-600 mb-8">
              Understanding the trade-offs between JWT tokens and traditional sessions helps you choose the right
              authentication strategy for your application.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Aspect</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-purple-700">JWT (Stateless)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Sessions (Stateful)</th>
                  </tr>
                </thead>
                <tbody>
                  {jwtComparison.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-700 font-medium">{row.aspect}</td>
                      <td className={`py-3 px-4 text-sm ${row.jwtAdvantage === true ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                        {row.jwt}
                      </td>
                      <td className={`py-3 px-4 text-sm ${row.jwtAdvantage === false ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                        {row.session}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Token-Based Authentication Flow</h3>
            <p className="text-slate-600 mb-8">
              JWT authentication follows a simple, stateless flow. The token contains all necessary information,
              eliminating the need for server-side session storage.
            </p>

            <div className="space-y-6">
              {authFlowSteps.map((step) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: step.step * 0.1 }}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-600 mb-3">{step.description}</p>
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-slate-300">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Why JWT-First Wins</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Scales Horizontally</h4>
                  <p className="text-slate-600">
                    No session state to synchronize. Add more servers, load balance freely, and scale without
                    worrying about where a user's session lives.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Simpler Infrastructure</h4>
                  <p className="text-slate-600">
                    No Redis, no Memcached, no session database. Authentication becomes a cryptographic verification
                    problem, not a storage problem.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Server className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Microservices Ready</h4>
                  <p className="text-slate-600">
                    Any service can validate the JWT without contacting a central auth service. Enables true
                    service independence and reduces latency.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lock className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">No CSRF Vulnerabilities</h4>
                  <p className="text-slate-600">
                    JWTs are typically stored in memory or localStorage and sent via Authorization headers.
                    No cookies means no CSRF attack surface.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-8 border border-purple-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  JWT-first authentication eliminates session state, simplifies infrastructure, and enables
                  horizontal scaling. While session-based auth has its place (revocation requirements, very
                  large tokens), JWT is the right choice for modern, stateless, cloud-native applications.
                  Trade-offs exist, but for most applications the benefits far outweigh the complexity.
                </p>
                <Link
                  href="/docs/auth"
                  className="inline-flex items-center gap-2 text-purple-700 font-medium hover:text-purple-800"
                >
                  Explore Authentication Documentation
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Security Principles</h2>
              <p className="text-slate-600">Why fail-closed and zero trust are non-negotiable</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {securityBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Icon className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Security in Code</h3>
            <p className="text-slate-600 mb-8">
              These examples demonstrate how security principles translate into actual code. Fail closed,
              explicit permissions, comprehensive audit logging, and zero trust aren't abstract concepts—
              they're concrete implementation decisions.
            </p>

            <div className="space-y-8">
              {securityExamples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-slate-900 mb-2">{example.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{example.description}</p>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Anti-Patterns to Avoid</h3>
            <p className="text-slate-600 mb-8">
              Security failures often come from well-intentioned but dangerous patterns. Learn these anti-patterns
              to avoid introducing vulnerabilities.
            </p>

            <div className="space-y-4">
              {securityAntiPatterns.map((antiPattern) => {
                const Icon = antiPattern.icon
                return (
                  <div key={antiPattern.pattern} className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-200">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{antiPattern.pattern}</h4>
                      <p className="text-sm text-slate-600 mb-2"><strong>Problem:</strong> {antiPattern.problem}</p>
                      <p className="text-sm text-emerald-700"><strong>Solution:</strong> {antiPattern.solution}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Why Security-First Wins</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="w-5 h-5 text-red-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Prevents Breaches, Not Detects Them</h4>
                  <p className="text-slate-600">
                    Fail-closed defaults mean attackers can't exploit configuration errors. Implicit trust is
                    the root cause of most security breaches—eliminate it at the design level.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Code className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Auditable by Design</h4>
                  <p className="text-slate-600">
                    Explicit permissions and comprehensive logging mean you can always answer "who did what and when."
                    Security reviews become code reviews, not separate investigations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lock className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Zero Trust Works Everywhere</h4>
                  <p className="text-slate-600">
                    Trusting networks, internal services, or admin accounts creates attack surfaces. Zero trust
                    eliminates entire classes of vulnerabilities by assuming every request could be malicious.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Operational Simplicity</h4>
                  <p className="text-slate-600">
                    Fewer "why does this work?" incidents. No hunting down hidden permissions. Clear security
                    models reduce operational burden and mean time to resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-8 border border-red-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Security isn't a feature you add later—it's a foundation you build on. Fail closed, explicit
                  permissions, comprehensive audit logging, and zero trust aren't optional extras. They're non-
                  negotiable principles that prevent entire classes of vulnerabilities. When security is implicit
                  or permissive by default, you're not building secure systems—you're building lucky systems.
                  Eventually, luck runs out. Foundations don't.
                </p>
                <Link
                  href="/docs/errors"
                  className="inline-flex items-center gap-2 text-red-700 font-medium hover:text-red-800"
                >
                  Explore Security & Error Documentation
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Link>
        </div>
      </main>
    </div>
  )
}
