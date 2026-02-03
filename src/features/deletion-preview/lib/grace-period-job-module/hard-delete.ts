/**
 * Grace Period Job - Module - Hard Delete Handler
 */

import type { ProjectToHardDelete } from '../types'
import { hardDeleteProjectInTransaction } from './db'
import { logHardDeletedProject, logHardDeleteFailed } from './logger'

export async function hardDeleteProject(
  pool: any,
  project: ProjectToHardDelete
): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await hardDeleteProjectInTransaction(client, project)
    await client.query('COMMIT')
    logHardDeletedProject(project)
  } catch (error) {
    await client.query('ROLLBACK')
    logHardDeleteFailed(project.projectId, error)
    throw error
  } finally {
    client.release()
  }
}
