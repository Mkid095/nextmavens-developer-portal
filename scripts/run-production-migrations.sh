#!/bin/bash
#
# Production Migration Runner
#
# This script runs database migrations on the production server.
# It should be executed from within the Docker container or on the server
# with access to the Dokploy network.
#
# Usage on production server:
#   docker exec -it nextmavens-developer-portal bash -c "./scripts/run-production-migrations.sh"
#
# Or from the host with docker-compose:
#   docker-compose exec developer-portal bash -c "./scripts/run-production-migrations.sh"
#

set -e

echo "=========================================="
echo "NextMavens Production Migration Runner"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Must be run from the project root directory"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "This script requires DATABASE_URL to be set in the environment or .env file"
    exit 1
fi

echo "DATABASE_URL is configured"
echo ""

# Run the setup script with auto-confirmation
echo "Running database migrations..."
echo ""

pnpm tsx scripts/setup-database.ts --auto-confirm-breaking

echo ""
echo "=========================================="
echo "Migration Complete"
echo "=========================================="
echo ""

# Verify the setup
echo "Running verification..."
echo ""

pnpm tsx scripts/verify-database.ts

echo ""
echo "=========================================="
echo "Production database setup complete!"
echo "=========================================="
