import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req)

    const services = [
      {
        id: 'database',
        name: 'Database',
        description: 'PostgreSQL database with auto-generated REST & GraphQL APIs',
        icon: 'database',
        status: 'active',
        features: ['PostgREST API', 'GraphQL API', 'Row-Level Security', 'Multi-tenant'],
        endpoints: {
          rest: 'https://api.nextmavens.cloud',
          graphql: 'https://graphql.nextmavens.cloud',
        },
      },
      {
        id: 'auth',
        name: 'Authentication',
        description: 'JWT-based authentication with user management',
        icon: 'shield',
        status: 'active',
        features: ['JWT Tokens', 'User Registration', 'Password Reset', 'Social Auth'],
        endpoints: {
          auth: 'https://auth.nextmavens.cloud',
        },
      },
      {
        id: 'realtime',
        name: 'Realtime',
        description: 'WebSocket subscriptions for live database updates',
        icon: 'zap',
        status: 'active',
        features: ['WebSocket', 'Live Updates', 'Event Filtering', 'Auto-reconnect'],
        endpoints: {
          websocket: 'wss://realtime.nextmavens.cloud',
        },
      },
      {
        id: 'storage',
        name: 'Storage',
        description: 'File storage via Telegram integration',
        icon: 'folder',
        status: 'active',
        features: ['File Upload', 'CDN', 'Telegram Integration', 'Multiple File Types'],
        endpoints: {
          storage: 'https://telegram.nextmavens.cloud',
        },
      },
      {
        id: 'mcp',
        name: 'MCP Server',
        description: 'Model Context Protocol server for AI/IDE integration',
        icon: 'cpu',
        status: 'active',
        features: ['Claude Integration', 'ChatGPT Integration', 'Database Tools', 'Auth Tools'],
        endpoints: {
          npm: 'https://github.com/Mkid095/nextmavens-mcp-server',
        },
      },
    ]

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('[Developer Portal] Services error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get services' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}
