# Production Deployment Guide

## Database Migrations on Dokploy

The Developer Portal uses a remote PostgreSQL database that is only accessible within the Dokploy Docker network. To run migrations on production, you must execute them from within the deployed container or from a host that has access to the `dokploy-network`.

### Prerequisites

1. SSH access to the production VPS
2. Docker and docker-compose installed
3. The application deployed and running

### Running Migrations on Production

#### Option 1: Execute via Docker Exec (Recommended)

SSH into the production server and run:

```bash
# SSH to production server
ssh user@your-production-server

# Navigate to project directory
cd /path/to/developer-portal

# Execute migrations inside the running container
docker exec -it nextmavens-developer-portal bash -c "./scripts/run-production-migrations.sh"
```

#### Option 2: Execute via Docker Compose

```bash
# SSH to production server
ssh user@your-production-server

# Navigate to project directory
cd /path/to/developer-portal

# Execute migrations using docker-compose
docker-compose exec developer-portal bash -c "./scripts/run-production-migrations.sh"
```

#### Option 3: Run Directly on Host (if DATABASE_URL is set)

If the host has access to the database and `DATABASE_URL` is configured in `.env`:

```bash
# From project root
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-) pnpm tsx scripts/setup-database.ts --auto-confirm-breaking
```

### Verification

After running migrations, verify the database setup:

```bash
# Via docker exec
docker exec -it nextmavens-developer-portal bash -c "pnpm tsx scripts/verify-database.ts"

# Or via docker-compose
docker-compose exec developer-portal pnpm tsx scripts/verify-database.ts
```

### Troubleshooting

#### Database Connection Error

If you get `ENOTFOUND` or connection errors:
- Ensure you're running from within the Docker network
- Check that `DATABASE_URL` is correctly set in the container environment
- Verify the database service is accessible from the `dokploy-network`

#### Container Not Running

If the container isn't running:
```bash
# Start the application
docker-compose up -d

# Check container status
docker-compose ps
```

#### Migration Already Applied

If a migration was already applied, the script will skip it automatically. This is safe - you can re-run the migration script anytime.

### Current Production Database

- **Host**: Remote managed PostgreSQL service
- **Network**: Accessible via `dokploy-network` Docker network
- **Connection**: Configured via `DATABASE_URL` environment variable

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Migration tested on staging/dev environment
- [ ] Database backup created (if breaking changes)
- [ ] SSH access to production server verified
- [ ] Container is running and accessible
- [ ] Run migrations using one of the methods above
- [ ] Verify with `pnpm db:verify`
- [ ] Check application logs for errors
- [ ] Test critical API endpoints

### Rollback Plan

If migrations cause issues:

```bash
# Identify the problematic migration
docker exec -it nextmavens-developer-portal bash -c "psql \$DATABASE_URL -c 'SELECT version, description, applied_at FROM control_plane.schema_migrations ORDER BY applied_at DESC LIMIT 5;'"

# Manually revert the specific migration SQL (if reversible)
# Example: psql $DATABASE_URL -c "DROP TABLE IF EXISTS control_plane.new_table;"
```

### Automated Deployment (Future)

The `.github/workflows/deploy.yml` workflow is currently a placeholder. For production:

1. Set up GitHub Actions with SSH deployment key
2. Configure secrets: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_USER`, `PRODUCTION_SSH_KEY`
3. Add migration step to deployment workflow:

```yaml
- name: Run database migrations
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.PRODUCTION_SSH_HOST }}
    username: ${{ secrets.PRODUCTION_SSH_USER }}
    key: ${{ secrets.PRODUCTION_SSH_KEY }}
    script: |
      cd /path/to/developer-portal
      docker exec -it nextmavens-developer-portal bash -c "./scripts/run-production-migrations.sh"
```

### Security Notes

- Never commit `.env` files with production credentials
- Rotate `DATABASE_URL` if accidentally exposed
- Use strong, unique passwords for database users
- Enable SSL for database connections in production
- Keep migration files under version control
