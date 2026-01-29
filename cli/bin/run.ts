#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function showVersion(): void {
  console.log(`nextmavens-cli v${packageJson.version}`);
}

function showHelp(): void {
  console.log(`
NextMavens CLI v${packageJson.version}

USAGE:
  nextmavens [command] [options]

COMMANDS:
  hello       Say hello to the world

OPTIONS:
  --version   Show version number
  --help      Show help

For more information, visit: https://nextmavens.com/docs
  `);
}

function main(): void {
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
