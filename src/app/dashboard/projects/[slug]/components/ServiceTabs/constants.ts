import { Shield, HardDrive, Code2, LucideIcon } from 'lucide-react'

export const SERVICE_CONFIG = {
  auth: {
    title: 'Auth Service',
    overview: 'A complete authentication and user management system. Handle sign-ups, logins, password resets, and social providers with minimal code. Built-in security with JWT tokens and row-level security integration.',
    whenToUse: 'Use the Auth service for any application requiring user authentication. Perfect for web apps, mobile apps, and APIs that need secure user management, social logins, and protected routes.',
    docsUrl: 'https://docs.nextmavens.cloud/auth',
    quickActionLink: '/studio',
    quickActionText: 'Manage Users',
    quickActionIcon: Shield,
    quickActionSubPath: 'auth/users',
    securityInfo: {
      title: 'Security',
      text: 'All passwords are hashed using bcrypt. JWT tokens are signed with RS256 and expire after 1 hour by default.',
      color: 'blue' as const
    }
  },
  storage: {
    title: 'Storage Service',
    overview: 'A scalable file storage service with built-in CDN delivery. Upload, transform, and serve images, videos, and documents. Features include automatic image optimization, on-the-fly transformations, and signed URL generation for secure access.',
    whenToUse: 'Use the Storage service for any file handling needs - user avatars, document uploads, media galleries, backups, or any static assets. Perfect for applications requiring secure file storage with fast global delivery.',
    docsUrl: 'https://docs.nextmavens.cloud/storage',
    quickActionLink: '/studio',
    quickActionText: 'Create Bucket',
    quickActionIcon: HardDrive,
    quickActionSubPath: 'storage/buckets',
    securityInfo: {
      title: 'CDN Enabled',
      text: 'All files are automatically served through a global CDN for fast delivery. Image transformations are cached at the edge.',
      color: 'green' as const
    }
  },
  graphql: {
    title: 'GraphQL Service',
    overview: 'A powerful GraphQL API automatically generated from your database schema. Query your data with flexible, type-safe GraphQL operations. No manual API development required - the schema reflects your database structure in real-time.',
    whenToUse: 'Use the GraphQL service when you need flexible, efficient data fetching. Perfect for frontend applications, mobile apps, and any scenario where clients need to query exactly the data they need. Ideal for complex data relationships, nested queries, and avoiding over-fetching.',
    docsUrl: 'https://docs.nextmavens.cloud/graphql',
    quickActionLink: '/studio',
    quickActionText: 'Open GraphQL Playground',
    quickActionIcon: Code2,
    quickActionSubPath: null,
    securityInfo: null
  },
  realtime: {
    title: 'Realtime Service',
    overview: 'A real-time data synchronization service powered by PostgreSQL Change Data Capture (CDC). Subscribe to database changes and receive instant updates via WebSocket connections. Perfect for collaborative apps, live dashboards, and multi-user experiences.',
    whenToUse: 'Use the Realtime service when you need live data updates in your application. Ideal for collaborative editing, live dashboards, chat applications, notifications, activity feeds, and any scenario where users need to see changes instantly across multiple clients.',
    docsUrl: 'https://docs.nextmavens.cloud/realtime',
    quickActionLink: '/studio',
    quickActionText: 'Open WebSocket Console',
    quickActionIcon: Code2,
    quickActionSubPath: null,
    securityInfo: {
      title: 'Change Data Capture',
      text: 'Realtime uses PostgreSQL\'s logical replication to capture row-level changes. All INSERT, UPDATE, and DELETE operations are broadcast in real-time to subscribed clients.',
      color: 'green' as const,
      details: [
        { label: 'Protocol', value: 'WebSocket' },
        { label: 'Latency', value: '< 100ms' }
      ]
    }
  }
} as const

export type ServiceConfig = typeof SERVICE_CONFIG
export type ServiceKey = keyof ServiceConfig
