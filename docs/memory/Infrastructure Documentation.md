# Infrastructure Documentation

This document describes NextMavens' current infrastructure deployment, scaling roadmap, and operational procedures.

## Current Deployment

### Architecture Overview

NextMavens currently runs on a **single VPS deployment** with all services co-located.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Single VPS Instance                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Control   │  │    Data     │  │     Admin       │   │  │
│  │  │    Plane    │  │   Plane     │  │   Break Glass   │   │  │
│  │  │    API      │  │   API       │  │     Powers      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────┐      │  │
│  │  │           Web Application (Dashboard)            │      │  │
│  │  └──────────────────────────────────────────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                     │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │  control_plane  │  │   data_plane    │                │  │
│  │  │     schema      │  │     schema      │                │  │
│  │  └─────────────────┘  └─────────────────┘                │  │
│  │                                                               │  │
│  │  Per-project databases created on-demand                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Telegram Files (Storage/Backups)              │  │
│  │  • User file uploads                                       │  │
│  │  • Database backups (daily)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Characteristics

| Aspect | Current State |
|--------|---------------|
| **Infrastructure** | Single VPS (Virtual Private Server) |
| **Services** | All services co-located on same instance |
| **Web Server** | Next.js with built-in server / Node.js |
| **Database** | PostgreSQL on same VPS |
| **Storage** | Telegram for file storage and backups |
| **Region** | Single region (US-East) |
| **Scalability** | Vertical scaling only |
| **Load Balancing** | None (single instance) |
| **CDN** | Not implemented |

### Service Components

#### Control Plane
- **API**: `/api/*` endpoints for platform management
- **Authentication**: JWT-based developer authentication
- **Project Management**: CRUD operations for projects
- **API Key Management**: Generation and rotation of API keys
- **Break Glass Powers**: Emergency admin operations

#### Data Plane
- **Database API**: Direct database access for projects
- **Query Execution**: SQL query execution with safety limits
- **Schema Management**: Schema migrations and diffs
- **Edge Functions**: Serverless function deployment

#### Admin Dashboard
- **Project Monitoring**: View all projects and their status
- **Developer Management**: Manage developer accounts
- **Audit Logs**: Review system actions and changes
- **System Health**: Monitor service status

### Database Architecture

PostgreSQL is deployed on the same VPS with the following schema structure:

```
PostgreSQL Instance
│
├── control_plane schema
│   ├── developers      - Developer accounts
│   ├── projects        - Project metadata
│   ├── api_keys        - API key management
│   ├── admin_sessions  - Break glass sessions
│   ├── admin_actions   - Break glass audit logs
│   └── audit_logs      - General audit trail
│
└── data_plane schema (per project)
    ├── [project_name]  - Project-specific database
    └── [tables]        - User-defined tables
```

### Storage and Backups

- **File Storage**: Telegram API for file uploads
- **Database Backups**: Daily backups to Telegram
- **Backup Retention**: Configurable retention period
- **Recovery**: Manual restore from Telegram backups

### Network Architecture

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │  VPS Firewall   │
              │  (Port 80/443)  │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Node.js /     │
              │   Next.js App   │
              └─────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ PostgreSQL │  │  Telegram │  │  Logs /   │
  │  Database  │  │   Files   │  │ Monitoring│
  └───────────┘  └───────────┘  └───────────┘
```

### Current Limitations

- **Single Point of Failure**: No redundancy if VPS fails
- **Region Availability**: Only available in US-East region
- **Scalability**: Limited to single instance capacity
- **Disaster Recovery**: Manual backup restoration required
- **Monitoring**: Basic logging, no comprehensive observability
- **Auto-scaling**: Not implemented

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

### Future Targets (Planned)
- **Uptime Target**: 99.9% per month
- **Exclusions**:
  - Scheduled maintenance windows
  - Force majeure events
  - Customer-caused outages
- **Credit Policy**: Service credits for outages exceeding SLA (planned)

---

*Last Updated: 2026-01-30*
*Related PRDs: Backup Strategy, Disaster Recovery, Monitoring & Observability*
