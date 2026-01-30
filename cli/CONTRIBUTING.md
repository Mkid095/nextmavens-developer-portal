# Contributing to NextMavens CLI

Thank you for your interest in contributing to the NextMavens CLI! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Adding New Commands](#adding-new-commands)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Getting Help](#getting-help)

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm/yarn
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/nextmavens-developer-portal.git
cd nextmavens-developer-portal/cli
```

### Install Dependencies

```bash
# Install dependencies
pnpm install

# Or using npm
npm install
```

### Build the CLI

```bash
# Build TypeScript
pnpm build

# Or using npm
npm run build
```

### Link for Local Development

To test the CLI locally without publishing:

```bash
# Create a global symlink
pnpm link --global

# Now you can run `nextmavens` commands
nextmavens --version
```

To unlink later:

```bash
pnpm unlink --global
```

## Project Structure

```
cli/
├── src/
│   ├── commands/           # Command implementations
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── project/
│   │   ├── db/
│   │   ├── functions/
│   │   └── secrets/
│   ├── lib/               # Shared libraries
│   │   ├── api-client.ts  # API communication
│   │   └── config.ts      # Configuration management
│   └── index.ts           # CLI entry point
├── build.js               # Build script
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

- **Commands**: Each command is a separate file that exports a `run` function
- **API Client**: Handles all communication with the Control Plane API
- **Config Manager**: Manages local configuration storage

## Adding New Commands

### 1. Create the Command File

Create a new file in `src/commands/`:

```typescript
// src/commands/my-command.ts
import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command';

export default class MyCommand extends BaseCommand {
  static description = 'Description of what the command does';

  static examples = [
    '$ nextmavens my-command',
    '$ nextmavens my-command --option value',
  ];

  static flags = {
    // Define flags using oclif/parser
  };

  static args = {
    // Define arguments
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand);

    // Your command logic here
    this.log('Hello from my-command!');
  }
}
```

### 2. Register the Command

Add the command to `src/index.ts`:

```typescript
import MyCommand from './commands/my-command';

export const commands = [
  // ... existing commands
  MyCommand,
];
```

### 3. Update Documentation

1. Add the command to `README.md` in the Command Reference section
2. Add usage examples if applicable
3. Document any new flags or arguments

### 4. Add API Client Methods (if needed)

If your command needs to communicate with the API:

```typescript
// src/lib/api-client.ts

async myNewMethod(params: MyParams): Promise<MyResponse> {
  const response = await this.request('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return response.json();
}
```

### 5. Add TypeScript Types

```typescript
// src/lib/api-client.ts

export interface MyParams {
  param1: string;
  param2: number;
}

export interface MyResponse {
  id: string;
  status: string;
}
```

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Use interfaces for API contracts
- Avoid `any` types

### Error Handling

```typescript
// Always handle errors gracefully
try {
  const result = await this.apiClient.someMethod();
  this.log('Success!');
} catch (error) {
  if (error instanceof ApiError) {
    this.error(`API Error: ${error.message}`);
  }
  throw error;
}
```

### Logging

```typescript
// Use this.log() for output
this.log('Information message');

// Use this.error() for errors
this.error('Something went wrong');

// Use console.error() for debugging (remove before committing)
console.error('Debug info');
```

### Async/Await

- Always use async/await for asynchronous operations
- Handle promise rejections appropriately

```typescript
async run(): Promise<void> {
  try {
    const result = await this.apiClient.getData();
    this.processData(result);
  } catch (error) {
    this.handleError(error);
  }
}
```

## Testing

### Manual Testing

Test your changes manually:

```bash
# Build the CLI
pnpm build

# Link globally
pnpm link --global

# Test your command
nextmavens my-command --help
nextmavens my-command arg1 arg2
```

### Testing API Interactions

When testing API interactions:

1. Use a test project (not production)
2. Check that error messages are clear
3. Verify edge cases (missing arguments, invalid input)
4. Test rate limiting behavior

### Common Test Scenarios

- Command with valid arguments
- Command with missing arguments
- Command with invalid arguments
- Unauthenticated user
- No project linked
- API errors (404, 500, etc.)
- Network errors

## Submitting Changes

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add new database backup command
fix: handle timeout errors gracefully
docs: update README with new examples
refactor: simplify API client error handling
```

### Pull Request Process

1. Create a new branch for your changes:

```bash
git checkout -b feature/my-new-command
```

2. Make your changes and commit them

3. Push to your fork:

```bash
git push origin feature/my-new-command
```

4. Create a pull request on GitHub

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Command works as expected
- [ ] Error messages are clear and helpful
- [ ] Documentation is updated (README.md)
- [ ] TypeScript types are defined
- [ ] Edge cases are handled
- [ ] Commit messages are clear

## Getting Help

### Documentation

- README.md: General usage and command reference
- API Documentation: Control Plane API docs
- oclif Documentation: https://oclif.io/docs/

### Community

- GitHub Issues: Report bugs or request features
- Discord: Join for real-time help
- GitHub Discussions: Ask questions and share ideas

### Development Resources

- [oclif Documentation](https://oclif.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Code Review Process

All submissions require review before merging. Maintainers will check for:

1. **Functionality**: Does the command work as intended?
2. **Error Handling**: Are errors handled gracefully?
3. **User Experience**: Is the command intuitive to use?
4. **Documentation**: Is the code well-documented?
5. **Type Safety**: Are TypeScript types properly defined?
6. **Security**: Are credentials and tokens handled securely?

## Recognition

Contributors are recognized in the project's CONTRIBUTORS.md file. Thank you for making the NextMavens CLI better!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
