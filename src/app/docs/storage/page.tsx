'use client'

import Link from 'next/link'
import { HardDrive, ArrowLeft, ArrowRight, Server, CheckCircle, Code, Upload, Download } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const storageConfig = {
  domain: 'https://telegram-api.nextmavens.cloud',
  port: 4005,
  features: ['File Upload', 'CDN URLs', 'Metadata', 'Telegram Integration'],
  maxFileSize: '50 MB',
}

const endpoints = [
  {
    name: 'Upload File',
    method: 'POST',
    path: '/api/files',
    description: 'Upload a new file to Telegram storage',
    contentType: 'multipart/form-data',
    request: {
      file: 'File (multipart/form-data)',
      folder: 'string (optional, e.g., /uploads/images)',
      metadata: 'object (optional, custom metadata)',
    },
    response: {
      id: 'Unique file identifier (e.g., f_abc123xyz456)',
      name: 'Original filename',
      size: 'File size in bytes',
      mimeType: 'File MIME type',
      url: 'Telegram file URL',
      downloadUrl: 'Signed download URL',
      createdAt: 'Upload timestamp',
      folder: 'Folder path',
    },
  },
  {
    name: 'Get File Info',
    method: 'GET',
    path: '/api/files/{fileId}',
    description: 'Get metadata for a specific file',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
    response: {
      id: 'File ID',
      name: 'Original filename',
      size: 'File size in bytes',
      mimeType: 'File MIME type',
      url: 'Telegram file URL',
      downloadUrl: 'Signed download URL',
      createdAt: 'Upload timestamp',
      folder: 'Folder path',
      metadata: 'Custom metadata object',
    },
  },
  {
    name: 'Download File',
    method: 'GET',
    path: '/api/files/{fileId}/download',
    description: 'Download a file by ID (redirects to Telegram CDN)',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
  },
  {
    name: 'List Files',
    method: 'GET',
    path: '/api/files',
    description: 'List all files with optional filtering',
    queryParams: {
      folder: 'Filter by folder path',
      limit: 'Maximum files to return (default: 50)',
      offset: 'Pagination offset (default: 0)',
    },
    response: {
      files: 'Array of file metadata objects',
      total: 'Total file count',
      hasMore: 'Whether more files exist',
    },
  },
  {
    name: 'Delete File',
    method: 'DELETE',
    path: '/api/files/{fileId}',
    description: 'Delete a file from storage',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
    response: {
      success: 'true if deleted',
    },
  },
]

const supportedFormats = [
  { category: 'Images', formats: ['JPG', 'JPEG', 'PNG', 'GIF', 'WebP', 'SVG'] },
  { category: 'Documents', formats: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT'] },
  { category: 'Videos', formats: ['MP4', 'MOV', 'AVI', 'WebM'] },
  { category: 'Audio', formats: ['MP3', 'WAV', 'OGG', 'M4A'] },
]

export default function StorageDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/docs/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-xl">
            <HardDrive className="w-6 h-6 text-orange-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Telegram Storage</h1>
            <p className="text-slate-600">File storage via Telegram with CDN access</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Base URL</span>
              </div>
              <code className="text-xs text-blue-700 break-all">{storageConfig.domain}</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Max File Size</span>
              </div>
              <p className="text-sm text-slate-700">{storageConfig.maxFileSize}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Features</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {storageConfig.features.map((feat) => (
                  <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Endpoints</h2>
        <div className="space-y-6 mb-12">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{endpoint.name}</h3>
                    <p className="text-slate-600">{endpoint.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                    endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {endpoint.method}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Endpoint:</span>
                  <code className="bg-slate-100 px-2 py-0.5 rounded">{storageConfig.domain}{endpoint.path}</code>
                </div>
              </div>

              <div className="p-6">
                {endpoint.request && (
                  <>
                    <h4 className="font-semibold text-slate-900 mb-3">Request</h4>
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <CodeBlockWithCopy>{JSON.stringify(endpoint.request, null, 2)}</CodeBlockWithCopy>
                    </div>
                  </>
                )}

                {endpoint.headers && (
                  <>
                    <h4 className="font-semibold text-slate-900 mb-3">Headers</h4>
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <CodeBlockWithCopy>{JSON.stringify(endpoint.headers, null, 2)}</CodeBlockWithCopy>
                    </div>
                  </>
                )}

                {endpoint.queryParams && (
                  <>
                    <h4 className="font-semibold text-slate-900 mb-3">Query Parameters</h4>
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <CodeBlockWithCopy>{JSON.stringify(endpoint.queryParams, null, 2)}</CodeBlockWithCopy>
                    </div>
                  </>
                )}

                <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
                <div className="bg-slate-50 rounded-lg p-3">
                  <CodeBlockWithCopy>{JSON.stringify({ success: true, data: endpoint.response }, null, 2)}</CodeBlockWithCopy>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-slate-900">Code Examples</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Upload File (FormData)</h3>
              <CodeBlockWithCopy>{`// Upload a file
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
console.log('File uploaded:', data.id, data.url);`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Get File Info</h3>
              <CodeBlockWithCopy>{`// Get file metadata
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files/f_abc123xyz456',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data } = await response.json();
console.log('File info:', data.name, data.size);`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Download File</h3>
              <CodeBlockWithCopy>{`// Download file (redirects to Telegram CDN)
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files/f_abc123xyz456/download',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

// Response redirects to actual file URL
const blob = await response.blob();`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">List Files</h3>
              <CodeBlockWithCopy>{`// List files in a folder
const response = await fetch(
  'https://telegram-api.nextmavens.cloud/api/files?folder=/uploads&limit=20',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data } = await response.json();
console.log('Files:', data.files, 'Total:', data.total);`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Delete File</h3>
              <CodeBlockWithCopy>{`// Delete a file
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
console.log('Deleted:', data.success);`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Supported File Formats</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {supportedFormats.map((category) => (
              <div key={category.category} className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">{category.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.formats.map((format) => (
                    <span key={format} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-700">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/graphql" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            GraphQL Docs
          </Link>
          <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Realtime Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
