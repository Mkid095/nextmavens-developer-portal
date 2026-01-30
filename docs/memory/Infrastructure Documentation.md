# Infrastructure Documentation

This document describes NextMavens' current infrastructure deployment, scaling roadmap, and operational procedures.

## Current Deployment

### Architecture Overview

NextMavens currently runs on a **single VPS deployment** with the application containerized and connected to remote services.

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

### Deployment Characteristics

| Aspect | Current State |
|--------|---------------|
| **Infrastructure** | Single VPS (Docker container) |
| **Container Runtime** | Docker with docker-compose |
| **Web Server** | Next.js standalone with Node.js 18-alpine |
| **Reverse Proxy** | Traefik (HTTPS termination) |
| **Domain** | https://portal.nextmavens.cloud |
| **Database** | Remote PostgreSQL (managed service) |
| **Storage** | Telegram API for file uploads/backups |
| **Auth Service** | External auth service integration |
| **Audit Service** | External audit logging service |
| **Email Service** | Resend API for notifications |
| **Region** | Single region |
| **Scalability** | Vertical scaling only |
| **Load Balancing** | Traefik (single instance) |
| **CDN** | Not implemented |

### Docker Configuration

The application is deployed using Docker with the following configuration:

**docker-compose.yml:**
- Container: `nextmavens-developer-portal`
- Port mapping: `3006:3000` (host:container)
- Network: `dokploy-network` (external Traefik network)
- Restart policy: `unless-stopped`
- Base image: `node:18-alpine`

**Traefik Labels:**
- HTTPS enabled with Let's Encrypt
- Domain: `portal.nextmavens.cloud`
- TLS certificate resolver: `letsencrypt`
- Entry point: `websecure`

### Service Components

#### Control Plane APIs
- **Authentication**: `/api/auth/*` - Developer authentication (JWT)
- **Developer Auth**: `/api/developer/*` - Developer account management
- **Project Management**: `/api/projects/*` - CRUD operations
- **API Key Management**: `/api/admin/projects/[id]/regenerate-keys` - Key generation
- **Break Glass**: `/api/admin/break-glass/*` - Emergency admin operations
- **Admin Operations**: `/api/admin/*` - Platform management

#### Data Plane APIs
- **Database Query**: `/api/*` - Direct database access for projects
- **Schema Browser**: View and manage database schemas
- **Storage**: `/api/storage/*` - File upload via Telegram

#### External Service Integrations
- **Auth Service** (feature-flagged): User management via Studio interface
- **Audit Logs** (feature-flagged): External audit trail
- **Telegram Storage**: File uploads and backup storage
- **Resend Email**: Notification service for suspensions/alerts

### Database Architecture

**Remote PostgreSQL Database:**
- Host: `nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u` (managed service)
- Port: `5432`
- Database: `nextmavens`
- Connection Pool: Max 20 connections
- Multi-tenancy: Each project gets its own tenant
- Row Level Security (RLS) enabled

**Schema Structure:**
```
PostgreSQL Database (Remote)
│
├── Core Tables
│   ├── developers         - Developer accounts
│   ├── projects           - Project metadata
│   ├── api_keys           - API key storage (SHA-256 hashed)
│   ├── tenants            - Tenant information
│   ├── feature_flags      - Feature toggle management
│   └── audit_logs         - Audit trail
│
├── Abuse Control Tables
│   ├── project_quotas     - Hard cap configurations
│   ├── suspensions        - Project suspension records
│   ├── manual_overrides   - Admin override tracking
│   ├── pattern_detections - Malicious pattern tracking
│   ├── spike_detections   - Usage spike tracking
│   └── error_metrics      - Error rate tracking
│
└── Per-Project Schemas
    ├── [tenant_id]        - Tenant-specific data
    └── usage_metrics      - Resource usage tracking
```

### Storage and Backups

- **File Storage**: Telegram API for user file uploads
- **Database Backups**: Daily backups to Telegram (manual process)
- **Backup Retention**: Configurable retention period
- **Recovery**: Manual restore from Telegram backups

### Network Architecture

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

### Current Limitations

- **Single Point of Failure**: No redundancy if VPS fails
- **Single Region**: Only available in one region
- **Scalability**: Limited to single instance capacity
- **Disaster Recovery**: Manual backup restoration required
- **Monitoring**: Basic logging, no comprehensive observability
- **Auto-scaling**: Not implemented
- **Remote Dependencies**: Relies on external services (auth, audit)

---

## Scaling Phases

> **Status**: Planned for future releases

### Phase 1: Horizontal Scaling (Future)
- Load balancer for multiple application instances
- Database connection pooling
- Redis for session management and caching
- Estimated timeline: Q2 2026

### Phase 2: Multi-Region Deployment (Future)
- Regional deployments: US, EU, Asia
- Region selector for project creation
- Cross-region data replication (optional)
- Estimated timeline: Q3 2026

### Phase 3: Auto-Scaling (Future)
- Auto-scaling based on load metrics
- Container orchestration (Kubernetes/Docker)
- CDN for static assets
- Estimated timeline: Q4 2026

---

## Regional Data Isolation

> **Status**: Not implemented (planned)

### Current State
All data resides in the US-East region.

### Future Implementation
- **Data Residency**: Projects will be tied to specific regions
- **Compliance**: Support for GDPR and other regional regulations
- **Cross-Region Replication**: Optional replication for disaster recovery
- **Region Selector**: UI for choosing region during project creation

---

## Disaster Recovery

### Current Strategy
- **Backup Frequency**: Daily automated backups to Telegram
- **Backup Scope**: Full PostgreSQL database dump
- **Retention**: 30 days default
- **Recovery Time Objective (RTO)**: 4-8 hours (manual restore)
- **Recovery Point Objective (RPO)**: Up to 24 hours data loss

### Recovery Procedure
1. Access Telegram backup channel
2. Download latest database backup
3. Stop application services
4. Restore database from backup
5. Verify data integrity
6. Restart application services

### Future Improvements
- Real-time replication to secondary region
- Automated failover
- Hourly incremental backups
- Reduced RTO/RPO targets

---

## Monitoring Approach

### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connectivity check
- `GET /api/health/redis` - Redis connectivity check (future)

### Metrics Collection
- Request/response latency
- Error rates by endpoint
- Database query performance
- Active project count
- Resource utilization (CPU, memory, disk)

### Alerting
- Database connection failures
- High error rate thresholds
- Disk space warnings
- Service unavailability

### Status Page
> **Status**: Not implemented (planned)

---

## Service Dependencies

```
                    ┌─────────────────┐
                    │   Next.js App   │
                    └─────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │   Telegram    │   │    Redis      │
│   Database    │   │     API       │   │   (Future)    │
│   (Required)  │   │   (Required)  │   │   (Planned)   │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Critical Dependencies
- **PostgreSQL**: Required for all data persistence
- **Telegram API**: Required for file storage and backups
- **Redis**: Planned for caching and session management

### Service Health Impact
- PostgreSQL down: Complete system outage
- Telegram API down: File operations and backups unavailable
- Redis down: Degrade to in-memory sessions (when implemented)

---

## Security Architecture

### Network Isolation
- VPS firewall with port restrictions
- Only HTTP (80) and HTTPS (443) exposed
- SSH access restricted by key authentication

### TLS Everywhere
- All API endpoints use HTTPS
- TLS 1.2+ minimum
- Automatic certificate management (Let's Encrypt)

### Authentication
- JWT tokens for developer authentication
- Break glass session tokens for admin operations
- API key authentication for data plane access

### Data Encryption
- Data at rest: PostgreSQL encryption (optional)
- Data in transit: TLS encryption
- API keys: SHA-256 hashed storage
- Secrets: Encrypted storage (planned)

---

## FAQ

### **Q: What regions are currently supported?**
A: Currently, only US-East is available. Multi-region support is planned for Q3 2026.

### **Q: How does scaling work?**
A: Currently, we support vertical scaling only (upgrading VPS resources). Horizontal and auto-scaling are planned for future releases.

### **Q: How are backups handled?**
A: Daily automated backups are stored in Telegram. Manual restoration is required for disaster recovery.

### **Q: Is there a formal SLA?**
A: Currently, we offer best-effort availability. Formal SLA with 99.9% uptime target is planned for the future.

### **Q: What happens during maintenance?**
A: Maintenance windows will be announced in advance. Downtime is expected during maintenance periods.

---

## SLA Targets

### Current Status
**Best Effort** - No formal service level agreement at this time.

We are currently in the early stages of platform development and do not offer a formal SLA. However, we are committed to maintaining high availability and will communicate any significant outages through our status page (when implemented) and email notifications.

### Future Targets (Planned)

As we mature our infrastructure and implement multi-region deployment, we plan to offer the following SLA commitments:

#### Uptime Target
- **99.9% monthly uptime** (approximately 43.2 minutes of downtime per month)
- Measured from successful API requests to Control Plane and Data Plane endpoints
- Calculation: `(Total minutes in month - Downtime) / Total minutes in month × 100`

#### SLA Exclusions
The following are excluded from uptime calculations:

1. **Scheduled Maintenance**
   - Planned maintenance windows with at least 48 hours advance notice
   - Maintenance scheduled during low-traffic hours (typically 02:00-06:00 UTC)
   - Emergency maintenance for critical security patches (4 hours notice when possible)

2. **Force Majeure**
   - Natural disasters, acts of war, or terrorism
   - Internet infrastructure failures beyond our control
   - Third-party service outages (e.g., cloud providers, DNS services)
   - Government actions or regulations

3. **Customer-Caused Issues**
   - Downtime resulting from customer's API implementation errors
   - Rate limiting due to abuse or quota violations
   - Account suspension due to terms of service violations
   - Issues caused by customer's network or infrastructure

#### Credit Policy (Planned)

For eligible outages exceeding the SLA commitment, service credits will be issued as follows:

| Monthly Uptime | Service Credit |
|----------------|----------------|
| 99.0% to <99.9% | 10% of monthly fees |
| 95.0% to <99.0% | 25% of monthly fees |
| <95.0% | 100% of monthly fees |

**Credit Terms:**
- Credits applied to future billing cycles
- Maximum credit does not exceed one month of service fees
- Credits issued within 30 days of outage confirmation
- Customer must submit credit request within 30 days of outage

### Uptime Calculation Methodology

**Included in Uptime:**
- Successful HTTP responses (2xx status codes)
- API endpoint availability
- Database query execution
- Authentication service availability

**Excluded from Uptime:**
- Client-side network issues
- Third-party integration failures
- Feature-flagged functionality
- Non-critical services (e.g., analytics, logging)

### Monitoring & Reporting

- **Status Page**: Public status page at `status.nextmavens.cloud` (planned)
- **Incident History**: Public archive of past incidents and resolutions
- **Uptime Metrics**: Real-time and historical uptime data
- **Incident Notifications**: Email alerts for critical outages

### Related Documentation

- [Disaster Recovery](#disaster-recovery) - Recovery procedures and RTO/RPO targets
- [Monitoring Approach](#monitoring-approach) - Health endpoints and alerting
- [Scaling Phases](#scaling-phases) - Infrastructure maturity roadmap

---

*Last Updated: 2026-01-30*
*Related PRDs: Backup Strategy, Disaster Recovery, Monitoring & Observability*
