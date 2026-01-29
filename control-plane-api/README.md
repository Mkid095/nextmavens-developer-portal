# NextMavens Control Plane API

The authoritative API service for the NextMavens platform. This service provides the foundational API boundary for all governance operations.

## Project Structure

```
control-plane-api/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── internal/     # Internal endpoints (health checks, snapshots)
│   │       └── v1/          # Versioned public API endpoints
│   │           ├── projects/
│   │           ├── orgs/
│   │           └── keys/
│   └── lib/
│       ├── auth.ts         # JWT authentication utilities
│       └── db.ts           # Database connection pooling
├── package.json
├── tsconfig.json
└── next.config.js
```

## Setup

1. Install dependencies:
```bash
cd control-plane-api
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run development server:
```bash
pnpm dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Internal Endpoints

- `GET /internal/health` - Health check endpoint

### v1 Endpoints

- `POST /v1/projects` - Create new project
- `GET /v1/projects` - List all projects
- `GET /v1/projects/:id` - Get project details
- `PUT /v1/projects/:id` - Update project
- `DELETE /v1/projects/:id` - Delete project (soft delete)

## Authentication

All v1 endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Type Checking

Run typecheck:
```bash
pnpm typecheck
```
