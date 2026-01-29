# US-001: Document Current Deployment

## Story
As a platform operator, I want the current deployment architecture documented so that stakeholders understand our infrastructure state.

## Acceptance Criteria
- [x] Current state section created
- [x] Shows: single VPS deployment
- [x] Shows: services co-located
- [x] Shows: database location
- [x] Diagram of current architecture
- [x] Typecheck passes

## Implementation

### Current Deployment Architecture

#### Single VPS Deployment
The NextMavens Developer Portal is deployed on a single VPS running a Docker container with Traefik reverse proxy.

**Deployment Details:**
- **Container**: `nextmavens-developer-portal`
- **Base Image**: `node:18-alpine`
- **Port Mapping**: `3006:3000` (host:container)
- **Network**: `dokploy-network` (external Traefik network)
- **Domain**: `https://portal.nextmavens.cloud`
- **Restart Policy**: `unless-stopped`

#### Services Co-located on VPS
All application services run within a single Docker container:

1. **Next.js Application** (Port 3000)
   - Control Plane API
   - Data Plane API
   - Admin Dashboard
   - Web Application (Dashboard/UI)

2. **External Service Connections** (Remote)
   - PostgreSQL Database (managed service)
   - Telegram Storage API
   - Auth Service (feature-flagged)
   - Audit Logs Service (feature-flagged)
   - Resend Email Service

#### Database Location
The PostgreSQL database is hosted on a **remote managed service**, not co-located with the VPS.

**Connection Details:**
- Host: `nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u`
- Port: `5432`
- Database: `nextmavens`
- Connection Pool: Max 20 connections

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Single VPS Instance                         │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Docker Container (Traefik Network)            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │         Next.js Application (Port 3000)              │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │   │  │
│  │  │  │   Control   │  │    Data     │  │     Admin    │ │   │  │
│  │  │  │    Plane    │  │   Plane     │  │   Dashboard  │ │   │  │
│  │  │  │    API      │  │   API       │  │              │ │   │  │
│  │  │  └─────────────┘  └─────────────┘  └──────────────┘ │   │  │
│  │  │                                                     │   │  │
│  │  │  ┌─────────────────────────────────────────────┐   │   │  │
│  │  │  │       Web Application (Dashboard/UI)         │   │   │  │
│  │  │  └─────────────────────────────────────────────┘   │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼ (Remote)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │    │   Telegram    │    │   External    │
│   (Remote)    │    │   Storage     │    │   Services    │
│  Managed DB   │    │   Service     │    │  (Auth/Audit) │
└───────────────┘    └───────────────┘    └───────────────┘
```

#### Network Flow

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │     Traefik     │
              │  (Reverse Proxy)│
              │  TLS Termination│
              │  Let's Encrypt  │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   VPS Firewall  │
              │   (Port 3006)   │
              └─────────────────┘
                       │
                       ▼
        ┌────────────────────────────┐
        │  Docker Container           │
        │  nextmavens-developer-portal│
        │  Next.js App (Port 3000)    │
        └────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
  ┌───────────┐  ┌───────────┐    ┌───────────┐
  │ PostgreSQL │  │  Telegram │    │  External │
  │  (Remote)  │  │  Storage  │    │  Services │
  └───────────┘  └───────────┘    │ (Auth/    │
                                  │  Audit/   │
                                  │  Email)   │
                                  └───────────┘
```

### Configuration Files

**docker-compose.yml:**
```yaml
services:
  developer-portal:
    build: .
    container_name: nextmavens-developer-portal
    environment:
      - PORT=3000
      - DATABASE_URL=postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens
      - JWT_SECRET=nextmavens-portal-secret
      - REFRESH_SECRET=nextmavens-refresh-secret
      - NODE_ENV=production
    ports:
      - "3006:3000"
    restart: unless-stopped
    networks:
      - dokploy-network
    labels:
      - traefik.enable=true
      - traefik.http.routers.portal-nextmavens.rule=Host(`portal.nextmavens.cloud`)
      - traefik.http.routers.portal-nextmavens.entrypoints=websecure
      - traefik.http.routers.portal-nextmavens.tls.certresolver=letsencrypt
```

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
```

## Notes
- Database is on a remote managed PostgreSQL service (not co-located)
- Traefik handles HTTPS termination with Let's Encrypt certificates
- External service dependencies are feature-flagged
- Daily backups to Telegram (manual process)

## Typecheck Results
Typecheck passed successfully.

---
*Story implemented: 2026-01-30*
