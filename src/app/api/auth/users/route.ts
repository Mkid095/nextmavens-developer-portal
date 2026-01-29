/**
 * API Route: List Users
 * GET /api/auth/users - List all users with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { authServiceClient } from '@/lib/api/auth-service-client'
import type { EndUserListQuery } from '@/lib/types/auth-user.types'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    await authenticateRequest(req)

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const query: EndUserListQuery = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'active' | 'disabled' | 'deleted' | null) || undefined,
      auth_provider: (searchParams.get('auth_provider') as 'email' | 'google' | 'github' | 'microsoft' | null) || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      last_sign_in_after: searchParams.get('last_sign_in_after') || undefined,
      last_sign_in_before: searchParams.get('last_sign_in_before') || undefined,
      sort_by: (searchParams.get('sort_by') as 'created_at' | 'last_sign_in_at' | 'email' | 'name' | null) || undefined,
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc' | null) || undefined,
    }

    // Call auth service
    const response = await authServiceClient.listEndUsers(query)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error listing users:', error)

    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list users' },
      { status: 500 }
    )
  }
}
