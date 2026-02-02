/**
 * GraphQL Documentation - Module - About Postgraphile Component
 */

export function AboutPostgraphile() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">About Postgraphile</h2>
      <p className="text-slate-600 leading-relaxed mb-4">
        NextMavens GraphQL is powered by Postgraphile, which automatically generates a GraphQL schema from your
        PostgreSQL database. This means you get type-safe queries, mutations, and subscriptions without
        writing any schema definition code.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Auto-generated</h3>
          <p className="text-sm text-slate-600">Schema is generated from database tables and relationships automatically.</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Relay Support</h3>
          <p className="text-sm text-slate-600">Cursor-based pagination for efficient data fetching.</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Type Safe</h3>
          <p className="text-sm text-slate-600">Full TypeScript support with typed queries and responses.</p>
        </div>
      </div>
    </div>
  )
}
