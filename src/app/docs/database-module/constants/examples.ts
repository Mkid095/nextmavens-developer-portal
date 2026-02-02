/**
 * Database Documentation - Module - Code Examples
 */

import type { CodeExample } from '../types'

export const CODE_EXAMPLES: CodeExample[] = [
  {
    title: 'Fetch with JavaScript',
    code: `// Fetch users with filtering
const response = await fetch(
  'https://api.nextmavens.cloud/users?id=eq.1&select=id,name,email',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Accept': 'application/json'
    }
  }
);
const users = await response.json();`,
  },
  {
    title: 'Create Record',
    code: `// Create a new user
const response = await fetch('https://api.nextmavens.cloud/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    status: 'active'
  })
});
const newUser = await response.json();`,
  },
  {
    title: 'Update Record',
    code: `// Update user by ID
const response = await fetch('https://api.nextmavens.cloud/users/1', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    updated_at: new Date().toISOString()
  })
});
const updated = await response.json();`,
  },
]
