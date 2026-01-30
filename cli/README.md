# NextMavens CLI

The official command-line interface for the NextMavens platform. Manage your projects, databases, edge functions, and secrets from the terminal.

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

## Requirements

- Node.js >= 18.0.0

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

## Commands

### Authentication

```bash
# Login with email and password
nextmavens login

# Logout and remove stored token
nextmavens logout

# Show current authenticated user
nextmavens whoami
```

### Project Management

```bash
# Create a new project
nextmavens project create <name>

# List all your projects
nextmavens project list

# Link current directory to a project
nextmavens project link [id/slug]
```

### Database Operations

```bash
# Push schema changes to project database
nextmavens db push

# Show diff between local and remote schema
nextmavens db diff

# Reset database to initial state (dev only)
nextmavens db reset
```

### Edge Functions

```bash
# Deploy edge functions
nextmavens functions deploy [name]

# List deployed functions
nextmavens functions list

# View function logs
nextmavens functions logs <name>
```

### Secrets Management

```bash
# Set a secret for the linked project
nextmavens secrets set <key> <value>

# List all secret names (values hidden)
nextmavens secrets list

# Delete a secret
nextmavens secrets delete <key>
```

### Status

```bash
# Show linked project status and information
nextmavens status
```

## Configuration

The CLI stores configuration in `~/.nextmavens/config.json`, including:

- `auth_token`: Your authentication token
- `default_project_id`: Your linked project ID
- `api_base_url`: The API base URL (defaults to http://localhost:3000)

## Getting Help

```bash
# Show general help
nextmavens --help

# Show version
nextmavens --version
```

## License

MIT

## Support

For issues, questions, or contributions, please visit:
- Documentation: https://nextmavens.com/docs
- Issues: https://github.com/nextmavens/nextmavens-developer-portal/issues
