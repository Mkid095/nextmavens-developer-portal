/**
 * Auto-run migration for organizations tables on first API access
 *
 * This ensures the tables exist when the orgs API is first called.
 */

import { createOrganizationsTables } from '@/features/organizations'
import { NextRequest, NextResponse } from 'next/server'

let migrationRan = false
let migrationInProgress = false

export async function ensureOrganizationsTablesExist() {
  if (migrationRan) {
    return
  }

  if (migrationInProgress) {
    // Wait for ongoing migration
    await new Promise(resolve => setTimeout(resolve, 1000))
    return ensureOrganizationsTablesExist()
  }

  migrationInProgress = true

  try {
    const result = await createOrganizationsTables()
    migrationRan = result.success
  } catch (error) {
    console.error('[Organizations Migration] Error:', error)
  } finally {
    migrationInProgress = false
  }
}
