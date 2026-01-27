# NextMavens Developer Portal

Developer portal for managing projects, API keys, and viewing usage statistics on the NextMavens platform.

## Features

- **Developer Authentication** - Sign up and login
- **Project Management** - Create and manage projects
- **Tenant Provisioning** - Automatic tenant creation for each project
- **API Key Generation** - Generate public (pk_) and secret (sk_) keys
- **Usage Statistics** - View request counts, errors, and performance metrics
- **Dashboard** - Overview of all projects and activity

## Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/developer/register` | Register new developer |
| POST | `/api/developer/login` | Login developer |
| GET | `/api/developer/me` | Get current developer |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create new project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project details |
| GET | `/api/projects/:id/schema` | Get database schema |
| GET | `/api/projects/:id/stats` | Get project statistics |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/keys` | List API keys |
| POST | `/api/projects/:id/keys` | Create new API key |
| DELETE | `/api/keys/:id` | Revoke API key |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/developer/dashboard` | Get dashboard stats |

## Usage

### Register Developer

```bash
curl -X POST https://portal.nextmavens.cloud/api/developer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "secure_password",
    "name": "John Doe",
    "organization": "Acme Corp"
  }'
```

Response:
```json
{
  "developer": {
    "id": 1,
    "email": "developer@example.com",
    "name": "John Doe",
    "organization": "Acme Corp"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### Create Project

```bash
curl -X POST https://portal.nextmavens.cloud/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_name": "My E-commerce App",
    "webhook_url": "https://example.com/webhook",
    "allowed_origins": ["https://myapp.com", "http://localhost:3000"]
  }'
```

Response:
```json
{
  "project": {
    "id": 1,
    "project_name": "My E-commerce App",
    "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2026-01-27T12:00:00.000Z"
  },
  "api_keys": {
    "public_key": "nm_live_pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "secret_key": "nm_live_sk_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
  },
  "endpoints": {
    "gateway": "https://api.nextmavens.cloud",
    "auth": "https://auth.nextmavens.cloud",
    "graphql": "https://graphql.nextmavens.cloud",
    "rest": "https://api.nextmavens.cloud",
    "realtime": "wss://realtime.nextmavens.cloud",
    "storage": "https://telegram.nextmavens.cloud"
  },
  "database_url": "postgresql://...",
  "warning": "Save your API keys now! You won't be able to see the secret key again."
}
```

### List Projects

```bash
curl https://portal.nextmavens.cloud/api/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Additional API Key

```bash
curl -X POST https://portal.nextmavens.cloud/api/projects/1/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "key_type": "secret",
    "scopes": ["read", "write", "delete"],
    "rate_limit": 5000
  }'
```

### Get Project Statistics

```bash
curl https://portal.nextmavens.cloud/api/projects/1/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "stats": {
    "total_requests": 15234,
    "successful_requests": 14987,
    "failed_requests": 247,
    "avg_duration": 45.2
  },
  "by_date": [...],
  "top_paths": [...]
}
```

## API Key Types

### Public Key (nm_live_pk_)
- Safe to use in client-side code (browsers, mobile apps)
- Can only perform read operations
- Lower rate limits recommended

### Secret Key (nm_live_sk_)
- **NEVER** expose in client-side code
- Server-side only
- Can perform read, write, and delete operations
- Higher rate limits

## Rate Limits

Default: 1000 requests per minute per API key

Custom rate limits can be set when creating API keys.

Response when rate limited:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 1000 per minute",
  "retryAfter": 45
}
```

## Database Schema

Each project gets its own tenant in the database. The tenant has:
- `users` table - User accounts
- `tenants` table - Tenant information
- Row Level Security (RLS) enabled
- Isolated data per tenant

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- API keys hashed with SHA-256
- HTTPS only in production
- CORS enforcement per project

## Deployment

The portal is accessible at: `https://portal.nextmavens.cloud`

Environment variables are configured in docker-compose.yml.
