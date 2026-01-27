import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const developer = verifyAccessToken(token)

    const pool = getPool()
    const result = await pool.query(
      'SELECT id, email, name, organization, created_at FROM developers WHERE id = $1',
      [developer.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    return NextResponse.json({ developer: result.rows[0] })
  } catch (error) {
    console.error('[Developer Portal] Get developer error:', error)
    return NextResponse.json({ error: 'Failed to get developer' }, { status: 500 })
  }
}
