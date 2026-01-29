#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function showVersion() {
  console.log(`nextmavens-cli v${packageJson.version}`);
}

function showHelp() {
  console.log(`
NextMavens CLI v${packageJson.version}

USAGE:
  nextmavens [command] [options]

COMMANDS:
  login       Authenticate with email and password
  logout      Log out and remove stored token
  whoami      Show current authenticated user
  hello       Say hello to the world

OPTIONS:
  --version   Show version number
  --help      Show help

For more information, visit: https://nextmavens.com/docs
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'login':
      require('../dist/commands/login').login();
      break;
    case 'logout':
      require('../dist/commands/logout').logout();
      break;
    case 'whoami':
      require('../dist/commands/whoami').whoami();
      break;
    case 'hello':
      console.log('Hello from NextMavens CLI!');
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run "nextmavens --help" for usage information.');
      process.exit(1);
  }
}

main();
