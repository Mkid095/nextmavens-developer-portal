/**
 * Storage Service Content
 */

import { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../../../types'
import MultiLanguageCodeBlock from '@/components/MultiLanguageCodeBlock'
import type { ServiceContent } from '../types'

export const storageServiceContent: ServiceContent = {
  serviceName: 'Storage',
  overview: 'A scalable file storage service with built-in CDN delivery. Upload, transform, and serve images, videos, and documents. Features include automatic image optimization, on-the-fly transformations, and signed URL generation for secure access.',
  whenToUse: 'Use the Storage service for any file handling needs - user avatars, document uploads, media galleries, backups, or any static assets. Perfect for applications requiring secure file storage with fast global delivery.',
  getQuickStart: (projectId: string, endpoints: ServiceEndpoints) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
        <MultiLanguageCodeBlock
          examples={createCodeExamples({
            javascript: `import { createStorageClient } from '@nextmavens/storage'

const storage = createStorageClient({
  url: '${endpoints.storage}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${projectId}'
})`,
            python: `import nextmavens_storage

storage = nextmavens_storage.create_client(
    url='${endpoints.storage}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${projectId}'
)`,
            go: `package main

import "github.com/nextmavens/go-storage"

func main() {
    storage := gostorage.NewClient(gostorage.Config{
        URL: "${endpoints.storage}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${projectId}",
    })
}`,
            curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${projectId}"
export STORAGE_URL="${endpoints.storage}"`,
          })}
        />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Upload File</h4>
        <MultiLanguageCodeBlock
          examples={createCodeExamples({
            javascript: `const { data, error } = await storage.upload('avatars', file, {
    upsert: false
  })`,
            python: `response = storage.upload(
    bucket='avatars',
    file=file,
    options={'upsert': False}
).execute()`,
            go: `data, err := storage.Upload("avatars", file, gostorage.UploadOptions{
    Upsert: false,
})`,
            curl: `curl -X POST "$STORAGE_URL/v1/object/avatars/filename.jpg" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: image/jpeg" \\
  --data-binary "@/path/to/file.jpg"`,
          })}
        />
      </div>
    </div>
  ),
  connectionDetails: (endpoints: ServiceEndpoints) => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600 mb-1">Storage Endpoint</p>
        <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.storage}</code>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>CDN Enabled:</strong> All files are automatically served through a global CDN for fast delivery. Image transformations are cached at the edge.
        </p>
      </div>
    </div>
  ),
  docsUrl: 'https://docs.nextmavens.cloud/storage',
}
