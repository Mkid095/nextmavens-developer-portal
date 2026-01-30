import * as readline from 'readline';
import { apiClient, ApiError } from '../lib/api-client';

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function hideQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);

    let password = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (char: string) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C
        stdout.write('\n');
        process.exit(0);
      } else if (char === '\u007f') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
        }
      } else {
        password += char;
      }
    };

    stdin.on('data', onData);
  });
}

export async function login(): Promise<void> {
  try {
    console.log('\nNextMavens Login');
    console.log('---------------\n');

    const email = await question('Email: ');
    if (!email) {
      console.error('Error: Email is required');
      process.exit(1);
    }

    const password = await hideQuestion('Password: ');
    if (!password) {
      console.error('Error: Password is required');
      process.exit(1);
    }

    console.log('\nAuthenticating...');

    const response = await apiClient.login(email, password);

    console.log('\n✓ Login successful!');
    console.log(`Welcome, ${response.developer.name}!`);
    console.log(`Email: ${response.developer.email}`);

    if (apiClient.isAuthenticated()) {
      console.log('\nYou are now authenticated. Use "nextmavens whoami" to verify.');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.statusCode === 401) {
        console.error('Invalid email or password. Please try again.');
      }
    } else {
      console.error('\n✗ Login failed:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
