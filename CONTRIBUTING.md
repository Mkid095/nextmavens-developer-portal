# Contributing to NextMavens Developer Portal

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Project Structure](#project-structure)

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (for local development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mkid095/developer-portal.git
cd developer-portal
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
pnpm tsx scripts/setup-database.ts
```

5. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

### Run Specific Test File

```bash
pnpm test src/lib/__tests__/auth.test.ts
```

### Test Requirements

- All tests must pass before merging
- New features require tests
- Aim for 80% code coverage
- Integration tests require database setup

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Avoid `any` types
- Use proper type definitions

### ESLint

```bash
# Run linting
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Max line length: 100 characters

### Naming Conventions

- Files: `kebab-case.ts` or `kebab-case.tsx`
- Components: `PascalCase.tsx`
- Functions/Variables: `camelCase`
- Constants/Enums: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### Import Order

1. Node.js built-ins
2. External dependencies
3. Internal modules (starting with `@/`)
4. Relative imports
5. Type imports (if separated)

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security-related changes

### Examples

```
feat(auth): add OAuth2 support

Implement OAuth2 authentication flow for third-party integrations.
Supports Google, GitHub, and Microsoft providers.

Closes #123
```

```
fix(api): resolve rate limiter memory leak

The rate limiter was not cleaning up expired entries, causing
memory to grow unbounded over time.

Fixes #456
```

## Submitting Pull Requests

### Before Submitting

1. **Update your branch**: `git pull origin master`
2. **Run tests**: `pnpm test`
3. **Run linting**: `pnpm lint`
4. **Type check**: `pnpm typecheck`
5. **Build verification**: `pnpm build`

### PR Guidelines

1. **Keep PRs focused**: One PR should do one thing
2. **Keep PRs small**: Aim for < 500 lines changed
3. **Write clear descriptions**: Explain what and why
4. **Link issues**: Reference related issues (e.g., `Fixes #123`)
5. **Add labels**: Use appropriate labels for categorization

### PR Review Process

1. Automated CI checks must pass
2. At least one approval required
3. Address all review comments
4. Squash commits before merge (if requested)

### PR Labels

- `enhancement`: New features or improvements
- `bug`: Bug fixes
- `documentation`: Documentation changes
- `tests`: Test additions or improvements
- `refactor`: Code refactoring
- `chore`: Maintenance tasks
- `security`: Security fixes
- `breaking`: Breaking changes

## Project Structure

```
developer-portal/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── api-gateway/            # API Gateway service
├── auth-service/           # Authentication service
├── cli/                    # CLI tool
├── migrations/             # Database migrations
├── scripts/                # Utility scripts
├── src/
│   ├── app/                # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── features/           # Feature-specific modules
│   │   ├── abuse-controls/
│   │   ├── api-keys/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── projects/
│   │   ├── studio/
│   │   └── webhooks/
│   ├── lib/                # Core library code
│   │   ├── auth/           # Authentication utilities
│   │   ├── crypto/         # Cryptographic functions
│   │   ├── middleware/     # API middleware
│   │   └── ...
│   └── types/              # TypeScript type definitions
├── tests/                  # Integration tests
├── vitest.config.ts        # Vitest configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Development Workflow

### Feature Development

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write/update tests
4. Run tests and linting
5. Commit with conventional commit message
6. Push to GitHub: `git push origin feature/your-feature`
7. Open a pull request

### Bug Fixing

1. Create a bugfix branch: `git checkout -b fix/your-bugfix`
2. Write a test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Run all tests
6. Commit and open PR

### Testing Guidelines

- Write tests for all new functionality
- Aim for high test coverage (>80%)
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies

## Getting Help

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing documentation

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something great together.

---

Thank you for contributing to NextMavens Developer Portal!
