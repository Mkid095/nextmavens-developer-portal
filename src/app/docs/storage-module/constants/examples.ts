/**
 * Storage Documentation - Code Examples
 */

import type { CodeExample } from '../types'

export const CODE_EXAMPLES: CodeExample[] = [
  {
    title: 'Upload File (FormData)',
    code: `// Upload a file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', '/uploads/images');

const response = await fetch('https://telegram-api.nextmavens.cloud/api/files', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const { data } = await response.json();
console.log('File uploaded:', data.id, data.url);`,
  },
  {
    title: 'Get File Info',
    code: `// Get file metadata
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files/f_abc123xyz456',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data } = await response.json();
console.log('File info:', data.name, data.size);`,
  },
  {
    title: 'Download File',
    code: `// Download file (redirects to Telegram CDN)
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files/f_abc123xyz456/download',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

// Response redirects to actual file URL
const blob = await response.blob();`,
  },
  {
    title: 'List Files',
    code: `// List files in a folder
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files?folder=/uploads&limit=20',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data } = await response.json();
console.log('Files:', data.files, 'Total:', data.total);`,
  },
  {
    title: 'Delete File',
    code: `// Delete a file
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files/f_abc123xyz456',
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data } = await response.json();
console.log('Deleted:', data.success);`,
  },
]
