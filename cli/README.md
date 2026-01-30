# NextMavens CLI

The official command-line interface for the NextMavens platform. Manage your projects, databases, edge functions, and secrets from the terminal.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
- [Usage Guides](#usage-guides)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The NextMavens CLI provides a complete terminal-based interface for managing your NextMavens projects. It's designed for developers who prefer command-line workflows and for CI/CD integration.

Key features:
- Complete project lifecycle management (create, link, monitor)
- Database schema management and migrations
- Edge function deployment and monitoring
- Secret management without leaving the terminal
- Works seamlessly with CI/CD pipelines

## Installation

### Global Installation (Recommended)

Install the CLI globally using npm:

```bash
npm install -g nextmavens-cli
```

Or using pnpm:

```bash
pnpm add -g nextmavens-cli
```

Or using yarn:

```bash
yarn global add nextmavens-cli
```

### Per-Project Installation

Install as a development dependency in your project:

```bash
npm install -D nextmavens-cli
# or
pnpm add -D nextmavens-cli
# or
yarn add -D nextmavens-cli
```

Then run using `npx nextmavens` or `pnpm nextmavens`.

### Verify Installation

```bash
nextmavens --version
```

## Requirements

- Node.js >= 18.0.0
- npm, pnpm, or yarn for installation

## Quick Start

```bash
# Login to your account
nextmavens login

# Create a new project
nextmavens project create my-awesome-project

# Link current directory to a project
nextmavens project link

# Check project status
nextmavens status
```

## Command Reference

### Authentication

#### `nextmavens login`

Authenticate with your NextMavens account.

```bash
nextmavens login
```

You'll be prompted for your email and password. Your authentication token is stored securely in `~/.nextmavens/config.json`.

#### `nextmavens logout`

Logout and remove your stored authentication token.

```bash
nextmavens logout
```

#### `nextmavens whoami`

Display information about the currently authenticated user.

```bash
nextmavens whoami
```

### Project Management

#### `nextmavens project create <name>`

Create a new NextMavens project.

```bash
# Create a project with a specific name
nextmavens project create my-awesome-project

# The command will:
# 1. Create the project via Control Plane API
# 2. Generate API keys
# 3. Automatically link the current directory to the new project
# 4. Display project details and credentials
```

#### `nextmavens project list`

List all projects for the authenticated user.

```bash
nextmavens project list

# Output shows:
# - Project ID
# - Project name
# - Slug
# - Status (active, suspended, etc.)
# - Linked indicator (if linked to current directory)
```

#### `nextmavens project link [id/slug]`

Link the current directory to an existing project.

```bash
# Link to a specific project by ID
nextmavens project link 12345678-1234-1234-1234-123456789012

# Link by slug
nextmavens project link my-awesome-project

# Interactive selection (no argument)
nextmavens project link
```

Linking creates a `.nextmavens/config.json` file in the current directory with the project association.

### Database Operations

#### `nextmavens db push`

Push schema changes from a local file to the project database.

```bash
# Push schema from default locations
nextmavens db push

# The CLI automatically detects schema files in order:
# 1. schema.sql
# 2. schema.prisma
# 3. supabase/schema.sql
# 4. migrations/*.sql
```

#### `nextmavens db diff`

Show differences between local and remote database schemas.

```bash
nextmavens db diff

# Output shows:
# - Tables that will be added
# - Tables that will be removed
# - Columns that will be added/modified/removed
# - Index changes
# - Foreign key changes
```

#### `nextmavens db reset`

Reset the database to its initial state (dev only).

```bash
nextmavens db reset

# Safety: Requires triple confirmation:
# 1. Enter project name
# 2. Type "I understand"
# 3. Type "RESET"
```

**Warning:** This will delete all data in the database. Only use in development environments.

### Edge Functions

#### `nextmavens functions deploy [name]`

Deploy edge functions to your project.

```bash
# Deploy all functions from the functions/ directory
nextmavens functions deploy

# Deploy a specific function
nextmavens functions deploy my-function

# The CLI detects functions in:
# - functions/subdirectory/index.ts
# - functions/subdirectory/index.js
# - functions/my-function.ts
# - functions/my-function.js
```

#### `nextmavens functions list`

List all deployed edge functions.

```bash
nextmavens functions list

# Output shows:
# - Function ID
# - Function slug/name
# - Status (active, inactive)
# - Invocation URL
# - Version
# - Invocation count
# - Last invocation time
```

#### `nextmavens functions logs <name>`

View logs for a specific function.

```bash
# View logs with default limit (50 entries)
nextmavens functions logs my-function

# Limit output to 20 entries
nextmavens functions logs my-function --limit 20

# View logs from the last hour
nextmavens functions logs my-function --since 1h
```

### Secrets Management

#### `nextmavens secrets set <key> <value>`

Set a secret for the linked project.

```bash
# Set a secret
nextmavens secrets set API_KEY sk_test_123456789

# Set database connection string
nextmavens secrets set DATABASE_URL "postgresql://user:pass@host:5432/db"
```

Secrets are encrypted and stored securely. They're injected as environment variables in your edge functions.

#### `nextmavens secrets list`

List all secret names (values are hidden).

```bash
nextmavens secrets list

# Output example:
# API_KEY        ••••••••••••••••  (created 2 days ago)
# DATABASE_URL   ••••••••••••••••  (updated 1 hour ago)
```

#### `nextmavens secrets delete <key>`

Delete a secret from your project.

```bash
nextmavens secrets delete API_KEY

# You'll be prompted to confirm the deletion
```

### Status

#### `nextmavens status`

Show comprehensive status of the linked project.

```bash
nextmavens status

# Output includes:
# - Project information (name, slug, ID, status)
# - Enabled services (database, auth, realtime, storage, functions)
# - Current usage metrics with percentages
# - Any warnings or issues
# - Approaching limits warnings (at 75% and 90%)
```

## Usage Guides

### Common Workflows

#### Setting Up a New Project

```bash
# 1. Login to your account
nextmavens login

# 2. Create a new project
nextmavens project create my-app

# 3. Create a database schema file
cat > schema.sql << EOF
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
EOF

# 4. Push the schema to your database
nextmavens db push

# 5. Set up environment variables
nextmavens secrets set JWT_SECRET your-secret-key

# 6. Verify everything is working
nextmavens status
```

#### Deploying Edge Functions

```bash
# 1. Create your function
mkdir -p functions/hello
cat > functions/hello/index.ts << EOF
export default function handler(req: Request) {
  return new Response(JSON.stringify({ message: "Hello World" }));
}
EOF

# 2. Deploy the function
nextmavens functions deploy hello

# 3. Check the deployment
nextmavens functions list

# 4. View logs if needed
nextmavens functions logs hello
```

#### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install NextMavens CLI
        run: npm install -g nextmavens-cli

      - name: Login to NextMavens
        env:
          NEXTMAVENS_TOKEN: ${{ secrets.NEXTMAVENS_TOKEN }}
        run: |
          echo "$NEXTMAVENS_TOKEN" > ~/.nextmavens/config.json

      - name: Push database schema
        run: nextmavens db push

      - name: Deploy functions
        run: nextmavens functions deploy
```

### Local Development

```bash
# Link to an existing project
nextmavens project link

# Make schema changes locally
vim schema.sql

# Preview the changes
nextmavens db diff

# Push when ready
nextmavens db push

# Monitor your usage
nextmavens status
```

## Configuration

The CLI stores configuration in two locations:

### Global Configuration

Located at `~/.nextmavens/config.json`:

```json
{
  "auth_token": "your-auth-token",
  "default_project_id": "your-project-id",
  "api_base_url": "https://api.nextmavens.com"
}
```

### Project Configuration

Located at `.nextmavens/config.json` in your project directory:

```json
{
  "project_id": "12345678-1234-1234-1234-123456789012",
  "project_name": "my-awesome-project",
  "slug": "my-awesome-project"
}
```

### Environment Variables

The CLI respects the following environment variables:

- `NEXTMAVENS_API_URL`: Override the API base URL
- `NEXTMAVENS_TOKEN`: Provide authentication token via environment

## Troubleshooting

### "Not logged in" error

```bash
# Login again
nextmavens login
```

### "No project linked" error

```bash
# Link to a project
nextmavens project link

# Or create a new one
nextmavens project create my-project
```

### Database push fails

```bash
# Check the schema file exists
ls -la schema.sql

# Preview changes first
nextmavens db diff

# Check project status
nextmavens status
```

### Function deployment fails

```bash
# Check function syntax
cat functions/my-function/index.ts

# Check function logs
nextmavens functions logs my-function

# Verify the function exists
ls -la functions/
```

### Enable verbose logging

```bash
# Set environment variable for detailed logs
export NEXTMAVENS_DEBUG=1
nextmavens status
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:

- Setting up the development environment
- Running tests
- Code style guidelines
- Submitting pull requests

## Getting Help

```bash
# Show general help
nextmavens --help

# Show help for a specific command
nextmavens project --help
nextmavens db push --help

# Show version
nextmavens --version
```

## License

MIT

## Support

For issues, questions, or contributions, please visit:
- Documentation: https://nextmavens.com/docs
- Issues: https://github.com/nextmavens/nextmavens-developer-portal/issues
- Discord: https://discord.gg/nextmavens
