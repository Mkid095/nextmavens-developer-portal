#!/usr/bin/env node

const packageJson = require('../package.json');

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

  project create <name>    Create a new project
  project list             List all projects
  project link [id/slug]   Link current directory to a project

  db push    Push schema changes to project database
  db diff    Show diff between local and remote schema
  db reset   Reset database to initial state (dev only)

  functions deploy [name]   Deploy edge functions
  functions list            List deployed functions
  functions logs <name>     View function logs

  hello       Say hello to the world

OPTIONS:
  --version   Show version number
  --help      Show help

For more information, visit: https://nextmavens.com/docs
  `);
}

async function main() {
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
      await (await import('./commands/login')).login();
      break;
    case 'logout':
      await (await import('./commands/logout')).logout();
      break;
    case 'whoami':
      await (await import('./commands/whoami')).whoami();
      break;
    case 'hello':
      console.log('Hello from NextMavens CLI!');
      break;
    case 'project':
      await handleProjectCommand(args.slice(1));
      break;
    case 'db':
      await handleDbCommand(args.slice(1));
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run "nextmavens --help" for usage information.');
      process.exit(1);
  }
}

async function handleProjectCommand(args: string[]) {
  const subcommand = args[0];

  if (!subcommand) {
    console.error('Error: project command requires a subcommand');
    console.error('Usage: nextmavens project <create|list|link> [options]');
    console.error('Run "nextmavens --help" for more information.');
    process.exit(1);
  }

  switch (subcommand) {
    case 'create':
      await (await import('./commands/project/create')).projectCreate(args[1]);
      break;
    case 'list':
      await (await import('./commands/project/list')).projectList();
      break;
    case 'link':
      await (await import('./commands/project/link')).projectLink(args[1]);
      break;
    default:
      console.error(`Unknown project command: ${subcommand}`);
      console.error('Available project commands: create, list, link');
      console.error('Run "nextmavens --help" for more information.');
      process.exit(1);
  }
}

async function handleDbCommand(args: string[]) {
  const subcommand = args[0];

  if (!subcommand) {
    console.error('Error: db command requires a subcommand');
    console.error('Usage: nextmavens db <push|diff|reset>');
    console.error('Run "nextmavens --help" for more information.');
    process.exit(1);
  }

  switch (subcommand) {
    case 'push':
      await (await import('./commands/db/push')).dbPush();
      break;
    case 'diff':
      await (await import('./commands/db/diff')).dbDiff();
      break;
    case 'reset':
      await (await import('./commands/db/reset')).dbReset();
      break;
    default:
      console.error(`Unknown db command: ${subcommand}`);
      console.error('Available db commands: push, diff, reset');
      console.error('Run "nextmavens --help" for more information.');
      process.exit(1);
  }
}

main();

export {};

