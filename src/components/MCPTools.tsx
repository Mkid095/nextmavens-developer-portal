const toolCategories = [
  {
    title: 'Database Tools',
    tools: [
      { name: 'nextmavens_query', description: 'Query data with filters' },
      { name: 'nextmavens_insert', description: 'Insert rows' },
      { name: 'nextmavens_update', description: 'Update records' },
      { name: 'nextmavens_delete', description: 'Delete rows' },
    ],
  },
  {
    title: 'Auth Tools',
    tools: [
      { name: 'nextmavens_signin', description: 'User login' },
      { name: 'nextmavens_signup', description: 'Create users' },
    ],
  },
  {
    title: 'Storage Tools',
    tools: [
      { name: 'nextmavens_file_info', description: 'Get file info' },
      { name: 'nextmavens_file_download_url', description: 'Get download URLs' },
      { name: 'nextmavens_list_files', description: 'List files' },
    ],
  },
  {
    title: 'GraphQL Tools',
    tools: [
      { name: 'nextmavens_graphql', description: 'Run GraphQL queries' },
      { name: 'nextmavens_graphql_introspect', description: 'Get schema info' },
    ],
  },
]

export default function MCPTools() {
  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Available MCP Tools</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {toolCategories.map((category, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{category.title}</h3>
            <ul className="space-y-3">
              {category.tools.map((tool, toolIndex) => (
                <li key={toolIndex} className="text-sm text-slate-600">
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {tool.name}
                  </code>
                  <span className="ml-2">{tool.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Filter Operators */}
      <div className="mt-12 bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Query Filter Operators</h3>
        <div className="grid grid-cols-4 gap-4">
          {['eq', 'neq', 'gt', 'gte', 'lte', 'like', 'ilike', 'in'].map((op) => (
            <div key={op} className="bg-slate-50 rounded-lg px-4 py-2 text-center">
              <code className="text-sm text-slate-700">{op}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
