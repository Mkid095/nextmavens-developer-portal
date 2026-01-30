export {
  createFeatureFlagsTable,
  dropFeatureFlagsTable
} from './migrations/create-feature-flags-table'

export {
  seedCoreFeatureFlags,
  removeCoreFeatureFlags
} from './migrations/seed-core-feature-flags'

export {
  up as addScopeIdToFeatureFlags,
  down as removeScopeIdFromFeatureFlags
} from './migrations/add-scope-id-to-feature-flags'
