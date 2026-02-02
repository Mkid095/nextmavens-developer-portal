/**
 * Service Tabs Constants
 *
 * Service-specific content including overview, usage examples, and code snippets
 */

import type { ServiceContent } from './types'

export { type ServiceContent } from './types'

export { authServiceContent } from './services/auth'
export { storageServiceContent } from './services/storage'
export { graphqlServiceContent } from './services/graphql'
export { realtimeServiceContent } from './services/realtime'

// Service registry for easy lookup
export const serviceContent: Record<string, ServiceContent> = {
  auth: () => require('./services/auth').authServiceContent,
  storage: () => require('./services/storage').storageServiceContent,
  graphql: () => require('./services/graphql').graphqlServiceContent,
  realtime: () => require('./services/realtime').realtimeServiceContent,
}
