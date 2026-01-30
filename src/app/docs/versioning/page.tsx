'use client'

import Link from 'next/link'
import { Tag, ArrowLeft, ArrowRight, BookOpen, Github, FileText, FileText as FileTextIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const versioningSections = [
  {
    id: 'api-versioning',
    title: 'API Versioning',
    icon: '🔌',
    color: 'blue',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          The NextMavens API uses URL path versioning to ensure backward compatibility as the platform evolves.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Version Prefix</h4>
            <p className="text-sm text-slate-600 mb-3">All API requests include the version number in the URL path:</p>
            <div className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-emerald-400 font-mono">https://api.nextmavens.cloud/v1/projects</code>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Version Header</h4>
            <p className="text-sm text-slate-600 mb-3">Alternatively, you can specify the version via the <code className="bg-slate-100 px-2 py-1 rounded">X-API-Version</code> header:</p>
            <div className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300 font-mono block">{`X-API-Version: 1`}</code>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">When Versions Change</h4>
          <p className="text-sm text-blue-800">
            New API versions are introduced when breaking changes are required. The current version is v1.
            When v2 is released, v1 will continue to work for at least 12 months with deprecation notices.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'sdk-versioning',
    title: 'SDK Semantic Versioning',
    icon: '📦',
    color: 'emerald',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          The NextMavens JavaScript SDK follows <strong>Semantic Versioning (SemVer)</strong>: <code className="bg-emerald-50 px-2 py-1 rounded text-emerald-700 font-mono">MAJOR.MINOR.PATCH</code>
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-900 mb-2">MAJOR (X.0.0)</h4>
            <p className="text-sm text-red-800">Incompatible API changes that require code modifications when upgrading.</p>
            <div className="mt-3 bg-red-100 rounded p-2">
              <code className="text-xs text-red-900 font-mono">1.0.0 → 2.0.0</code>
            </div>
            <ul className="mt-2 text-xs text-red-700 space-y-1">
              <li>• Removed or renamed methods</li>
              <li>• Changed method signatures</li>
              <li>• Modified return types</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 mb-2">MINOR (0.X.0)</h4>
            <p className="text-sm text-yellow-800">Backward-compatible functionality additions.</p>
            <div className="mt-3 bg-yellow-100 rounded p-2">
              <code className="text-xs text-yellow-900 font-mono">1.2.0 → 1.3.0</code>
            </div>
            <ul className="mt-2 text-xs text-yellow-700 space-y-1">
              <li>• New methods or features</li>
              <li>• New optional parameters</li>
              <li>• Extended functionality</li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-bold text-emerald-900 mb-2">PATCH (0.0.X)</h4>
            <p className="text-sm text-emerald-800">Backward-compatible bug fixes.</p>
            <div className="mt-3 bg-emerald-100 rounded p-2">
              <code className="text-xs text-emerald-900 font-mono">1.2.3 → 1.2.4</code>
            </div>
            <ul className="mt-2 text-xs text-emerald-700 space-y-1">
              <li>• Bug fixes</li>
              <li>• Performance improvements</li>
              <li>• Documentation updates</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-900">Compatibility Guarantees</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• <strong>Patch updates</strong> are always safe to upgrade (no breaking changes)</p>
            <p>• <strong>Minor updates</strong> are safe to upgrade but may add new features</p>
            <p>• <strong>Major updates</strong> may require code changes - review migration guide</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-medium text-emerald-900 mb-2">Version Ranges in package.json</h4>
          <p className="text-sm text-emerald-800 mb-3">Use version ranges to automatically receive compatible updates:</p>
          <div className="bg-slate-900 rounded-lg p-4 space-y-2">
            <code className="text-sm text-slate-300 font-mono block">{`// Allow patch and minor updates (recommended)
"nextmavens-js": "^1.2.3"`}</code>
            <code className="text-sm text-slate-300 font-mono block">{`// Allow only patch updates
"nextmavens-js": "~1.2.3"`}</code>
            <code className="text-sm text-slate-300 font-mono block">{`// Exact version (not recommended)
"nextmavens-js": "1.2.3"`}</code>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Update Strategy</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Patch updates (1.2.3 → 1.2.4):</strong> Apply immediately - includes bug fixes</p>
            <p><strong>Minor updates (1.2.0 → 1.3.0):</strong> Apply when convenient - new features</p>
            <p><strong>Major updates (1.0.0 → 2.0.0):</strong> Review migration guide and test thoroughly</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'deprecation-timeline',
    title: 'Deprecation Timeline',
    icon: '⏰',
    color: 'orange',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          NextMavens provides advance notice before removing or changing features to give you time to adapt.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-900 mb-2">Breaking Changes</h4>
            <p className="text-3xl font-bold text-red-700 mb-2">6 months</p>
            <p className="text-sm text-red-800">Minimum notice period before breaking changes take effect.</p>
            <ul className="mt-2 text-xs text-red-700 space-y-1">
              <li>• Announced in changelog</li>
              <li>• Marked as deprecated in API responses</li>
              <li>• Documentation updated with warnings</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 mb-2">Deprecations</h4>
            <p className="text-3xl font-bold text-yellow-700 mb-2">3 months</p>
            <p className="text-sm text-yellow-800">Minimum notice period before deprecated features are removed.</p>
            <ul className="mt-2 text-xs text-yellow-700 space-y-1">
              <li>• <code className="bg-yellow-100 px-1 rounded">Deprecated</code> header added</li>
              <li>• Alternative solutions documented</li>
              <li>• Migration assistance provided</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3">Deprecation Headers</h4>
          <p className="text-sm text-slate-600 mb-3">Deprecated endpoints return warning headers:</p>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-sm text-slate-300 font-mono block">{`Deprecated: true
Sunset: 2025-06-01
Alternative: /v2/projects`}</code>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'breaking-changes',
    title: 'Breaking Changes',
    icon: '⚠️',
    color: 'red',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          Breaking changes are avoided whenever possible. When necessary, they follow a clear process.
        </p>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-900 mb-3">Examples of Breaking Changes</h4>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>Removed endpoints:</strong> Entire API endpoints removed from service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>Changed schemas:</strong> Request or response data structures modified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>Renamed fields:</strong> Field names changed in responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>Type changes:</strong> Field data types altered (e.g., string → number)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span><strong>Required fields:</strong> Previously optional fields now required</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-bold text-emerald-900 mb-3">NOT Breaking Changes</h4>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Adding new endpoints:</strong> New APIs don't affect existing code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Adding optional fields:</strong> New response fields are backward compatible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Adding optional parameters:</strong> New request parameters don't break existing calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Bug fixes:</strong> Correcting behavior to match documentation</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Process for Introducing Breaking Changes</h4>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Announce change with 6+ months notice in changelog</li>
            <li>Mark affected endpoints as deprecated with warning headers</li>
            <li>Update documentation with migration instructions</li>
            <li>Provide migration guide with code examples</li>
            <li>Release new major version with breaking changes</li>
            <li>Maintain old version for 12 months after new release</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: 'version-discovery',
    title: 'Version Discovery',
    icon: '🔍',
    color: 'purple',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          Discover available API versions programmatically to build version-aware clients.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-900">GET /versions</h4>
          <p className="text-sm text-slate-600">Query the versions endpoint to see all available API versions:</p>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-sm text-slate-300 font-mono block">{`curl https://api.nextmavens.cloud/versions`}</code>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-900">Response Format</h4>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-sm text-slate-300 font-mono block">{`{
  "versions": [
    {
      "version": "v2",
      "current": true,
      "stable": true,
      "deprecated": false,
      "sunset_date": null,
      "url": "https://api.nextmavens.cloud/v2"
    },
    {
      "version": "v1",
      "current": false,
      "stable": true,
      "deprecated": true,
      "sunset_date": "2025-06-01",
      "url": "https://api.nextmavens.cloud/v1"
    }
  ]
}`}</code>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Response Fields</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>current:</strong> Whether this is the latest stable version</li>
            <li><strong>stable:</strong> Whether this version is recommended for production</li>
            <li><strong>deprecated:</strong> Whether this version is deprecated</li>
            <li><strong>sunset_date:</strong> When support will end (if deprecated)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'version-headers',
    title: 'Version Headers',
    icon: '📋',
    color: 'teal',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          API responses include version headers to help identify the API version and deprecation status.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-slate-900">Request Headers</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-slate-700">X-API-Version</p>
                <p className="text-xs text-slate-500">Specify API version (overrides URL path)</p>
                <div className="bg-slate-900 rounded p-2 mt-1">
                  <code className="text-xs text-emerald-400 font-mono">X-API-Version: 1</code>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-slate-900">Response Headers</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-slate-700">API-Version</p>
                <p className="text-xs text-slate-500">Version that handled the request</p>
                <div className="bg-slate-900 rounded p-2 mt-1">
                  <code className="text-xs text-emerald-400 font-mono">API-Version: v1</code>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Deprecated</p>
                <p className="text-xs text-slate-500">Present if version is deprecated</p>
                <div className="bg-slate-900 rounded p-2 mt-1">
                  <code className="text-xs text-red-400 font-mono">Deprecated: true</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3">Example Response Headers</h4>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-sm text-slate-300 font-mono block">{`HTTP/1.1 200 OK
API-Version: v1
Deprecated: true
Sunset: 2025-06-01
Link: <https://api.nextmavens.cloud/v2>; rel="successor-version"`}</code>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'compatibility-matrix',
    title: 'Client Compatibility',
    icon: '🔗',
    color: 'indigo',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          SDK and API version compatibility matrix to help you choose the right versions.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left font-medium text-slate-900">SDK Version</th>
                <th className="border border-slate-300 px-4 py-2 text-center font-medium text-slate-900">API v1</th>
                <th className="border border-slate-300 px-4 py-2 text-center font-medium text-slate-900">API v2</th>
                <th className="border border-slate-300 px-4 py-2 text-left font-medium text-slate-900">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-4 py-2 font-medium">2.x.x</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-red-600">✗</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-emerald-600">✓</td>
                <td className="border border-slate-300 px-4 py-2 text-slate-600">Latest, uses API v2 only</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 px-4 py-2 font-medium">1.5.x</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-emerald-600">✓</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-emerald-600">✓</td>
                <td className="border border-slate-300 px-4 py-2 text-slate-600">Compatible with both versions</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-4 py-2 font-medium">1.0.x - 1.4.x</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-emerald-600">✓</td>
                <td className="border border-slate-300 px-4 py-2 text-center text-yellow-600">~</td>
                <td className="border border-slate-300 px-4 py-2 text-slate-600">API v2 support limited</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-medium text-emerald-900 mb-2">Recommended Versions</h4>
          <ul className="text-sm text-emerald-800 space-y-1">
            <li>• <strong>New projects:</strong> Use SDK 2.x.x with API v2</li>
            <li>• <strong>Existing projects:</strong> Use SDK 1.5.x for API v2 migration</li>
            <li>• <strong>Legacy projects:</strong> Stay on API v1 until ready to migrate</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Legend</h4>
          <div className="flex gap-4 text-sm text-yellow-800">
            <span><span className="font-bold">✓</span> Fully supported</span>
            <span><span className="font-bold">~</span> Partial support</span>
            <span><span className="font-bold">✗</span> Not supported</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'sunset-policy',
    title: 'Sunset Policy',
    icon: '🌅',
    color: 'amber',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          Old API versions are supported for a defined period after a new version is released.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-bold text-amber-900 mb-3">1 Year Support Policy</h4>
          <p className="text-sm text-amber-800 mb-3">
            After a new major version is released, the previous version is supported for 12 months.
          </p>
          <div className="bg-white rounded p-3 text-sm text-amber-900">
            <p><strong>Example:</strong> If API v2 is released on January 1, 2025, API v1 will be supported until January 1, 2026.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-medium text-emerald-900 mb-2">During Support Period</h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Bug fixes and security patches</li>
              <li>• Critical issue resolution</li>
              <li>• Documentation maintenance</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">After Sunset Date</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• No updates or patches</li>
              <li>• May be discontinued without notice</li>
              <li>• Migration to newer version required</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Communication Timeline</h4>
          <ul className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>12 months before: Sunset date announced in changelog</li>
            <li>6 months before: Reminder emails to affected users</li>
            <li>3 months before: Final warning with migration guide</li>
            <li>0 months: Version sunset, support discontinued</li>
          </ul>
        </div>
      </div>
    ),
  },
]

export default function VersioningPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
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
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Tag className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Versioning Strategy</h1>
            <p className="text-slate-600">API and SDK versioning policies and migration guidelines</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            NextMavens follows semantic versioning for both APIs and SDKs to ensure backward compatibility
            and provide a clear upgrade path. This document explains how versioning works and how to
            prepare for version upgrades.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Predictable Updates</h3>
              <p className="text-sm text-slate-600">Semantic versioning tells you if an update is safe (patch/minor) or requires changes (major).</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Long Support Windows</h3>
              <p className="text-sm text-slate-600">Old versions supported for 12 months after new release with deprecation notices.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Clear Communication</h3>
              <p className="text-sm text-slate-600">All changes announced in advance with migration guides and support resources.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {versioningSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                </div>
              </div>
              <div className="p-6">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://github.com/Mkid095/nextmavens-js"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <Github className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">GitHub Repository</p>
                <p className="text-sm text-slate-600">View source code</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <FileText className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Report an Issue</p>
                <p className="text-sm text-slate-600">File bugs and requests</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <BookOpen className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Contributing</p>
                <p className="text-sm text-slate-600">How to contribute</p>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/infrastructure" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Infrastructure Docs
          </Link>
          <Link href="/docs/changelog" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            Changelog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
