/**
 * Base Repository for Control Plane API
 * Uses centralized connection manager from lib directory
 */

import { connectionManager } from '../../../lib/connection-manager'

export type QueryResult<T> = {
  data: T[] | null
  rowCount: number | null
}

/**
 * Base repository with common CRUD operations
 * All Control Plane repositories extend this class
 */
export class ControlPlaneBaseRepository<T extends Record<string, any> = any> {
  /**
   * Execute a query using the centralized connection manager
   */
  protected async executeQuery<R extends Record<string, any> = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<R>> {
    try {
      const result = await connectionManager.query<R>(sql, params)
      return {
        data: result.data,
        rowCount: result.rowCount,
      }
    } catch (error) {
      console.error('[ControlPlaneRepository] Query error:', { sql, params, error })
      throw error
    }
  }

  /**
   * Execute a transaction using the centralized connection manager
   */
  protected async executeTransaction<R = any>(
    callback: (client: any) => Promise<R>
  ): Promise<R> {
    return connectionManager.transaction(callback)
  }

  /**
   * Find by ID
   */
  async findById(id: string | number): Promise<{ data: T | null; error: Error | null }> {
    try {
      const result = await this.executeQuery<T>(
        `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      )
      return {
        data: result.data?.[0] || null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  /**
   * Find multiple records
   */
  async findMany(filters: Record<string, any> = {}, options: { limit?: number; offset?: number } = {}): Promise<{
    data: T[]
    total: number
    error: Error | null
  }> {
    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`${key} = $${paramIndex++}`)
        params.push(value)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const { limit = 100, offset = 0 } = options

      // Get count
      const countResult = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
        params
      )

      // Get data
      params.push(limit, offset)
      const dataResult = await this.executeQuery<T>(
        `SELECT * FROM ${this.tableName} ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        params
      )

      return {
        data: dataResult.data || [],
        total: parseInt(countResult.data?.[0]?.count || '0'),
        error: null,
      }
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error as Error,
      }
    }
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

      const result = await this.executeQuery<T>(
        `INSERT INTO ${this.tableName} (${keys.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      )

      return {
        data: result.data?.[0] || null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  /**
   * Update record
   */
  async update(id: string | number, data: Partial<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(data)) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }

      if (updates.length === 0) {
        return this.findById(id)
      }

      updates.push(`updated_at = NOW()`)
      values.push(id)

      const result = await this.executeQuery<T>(
        `UPDATE ${this.tableName}
         SET ${updates.join(', ')}
         WHERE ${this.primaryKey} = $${paramIndex}
         RETURNING *`,
        values
      )

      return {
        data: result.data?.[0] || null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  /**
   * Delete record (soft delete by default)
   */
  async delete(id: string | number, soft: boolean = true): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (soft) {
        await this.executeQuery(
          `UPDATE ${this.tableName}
           SET deleted_at = NOW()
           WHERE ${this.primaryKey} = $1`,
          [id]
        )
      } else {
        await this.executeQuery(
          `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
          [id]
        )
      }

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  // Abstract properties to be defined by subclasses
  protected tableName!: string
  protected primaryKey!: string
}
