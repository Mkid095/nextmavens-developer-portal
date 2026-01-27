import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest, generateApiKey, hashApiKey } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    const pool = getPool()
    const result = await pool.query(
      `SELECT id, name, public_key, created_at
       FROM api_keys
       WHERE developer_id = $1
       ORDER BY created_at DESC`,
      [developer.id]
    )

    return NextResponse.json({ apiKeys: result.rows })
  } catch (error: any) {
    console.error('[Developer Portal] Fetch API keys error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch API keys' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const pool = getPool()

    const publicKey = generateApiKey('public')
    const secretKey = generateApiKey('secret')
    const hashedSecretKey = hashApiKey(secretKey)

    const result = await pool.query(
      `INSERT INTO api_keys (developer_id, name, public_key, secret_key_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, public_key, created_at`,
      [developer.id, name, publicKey, hashedSecretKey]
    )

    return NextResponse.json({
      apiKey: result.rows[0],
      secretKey,
    })
  } catch (error: any) {
    console.error('[Developer Portal] Create API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    const pool = getPool()

    await pool.query(
      `DELETE FROM api_keys
       WHERE id = $1 AND developer_id = $2`,
      [keyId, developer.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Developer Portal] Delete API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete API key' }, { status: 401 })
  }
}
