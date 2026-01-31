'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const databaseExamples = [
  {
    title: 'Select Data',
    description: 'Retrieve data from a table with various filtering and sorting options',
    code: `// Select all columns
const { data, error } = await client
  .from('users')
  .select('*')

// Select specific columns
const { data } = await client
  .from('users')
  .select('id, email, name')

// Select with ordering
const { data } = await client
  .from('users')
  .select('*')
  .order('created_at', { ascending: false })

// Select with pagination
const { data } = await client
  .from('users')
  .select('*')
  .range(0, 9)  // First 10 records`,
  },
  {
    title: 'Insert Data',
    description: 'Add new records to a table',
    code: `// Insert a single record
const { data, error } = await client
  .from('users')
  .insert({
    email: 'user@example.com',
    name: 'John Doe',
    status: 'active'
  })
  .select()

// Insert multiple records
const { data } = await client
  .from('users')
  .insert([
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com', name: 'User Two' },
    { email: 'user3@example.com', name: 'User Three' }
  ])
  .select()`,
  },
  {
    title: 'Update Data',
    description: 'Modify existing records in a table',
    code: `// Update a single record
const { data, error } = await client
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', 1)
  .select()

// Update multiple records
const { data } = await client
  .from('users')
  .update({ verified: true })
  .eq('status', 'pending')
  .select()

// Update with conditional logic
const { data } = await client
  .from('users')
  .update({ last_login: new Date().toISOString() })
  .eq('email', 'user@example.com')
  .select()`,
  },
  {
    title: 'Delete Data',
    description: 'Remove records from a table',
    code: `// Delete a single record
const { error } = await client
  .from('users')
  .delete()
  .eq('id', 1)

// Delete multiple records
const { error } = await client
  .from('users')
  .delete()
  .in('id', [1, 2, 3])

// Delete with condition
const { error } = await client
  .from('users')
  .delete()
  .lt('created_at', '2024-01-01')`,
  },
  {
    title: 'Filter Operators',
    description: 'Use various filter operators to refine your queries',
    code: `// Equality filters
await client
  .from('users')
  .select('*')
  .eq('status', 'active')  // status = 'active'

// Not equal
await client
  .from('users')
  .select('*')
  .neq('status', 'inactive')  // status != 'inactive'

// Comparison operators
await client
  .from('products')
  .select('*')
  .gt('price', 100)  // price > 100

await client
  .from('products')
  .select('*')
  .gte('price', 100)  // price >= 100

await client
  .from('products')
  .select('*')
  .lt('price', 500)  // price < 500

await client
  .from('products')
  .select('*')
  .lte('price', 500)  // price <= 500

// String matching
await client
  .from('users')
  .select('*')
  .like('name', '%John%')  // name contains 'John'

await client
  .from('users')
  .select('*')
  .ilike('email', '%@example.com')  // case-insensitive

// Array operators
await client
  .from('posts')
  .select('*')
  .contains('tags', ['javascript', 'typescript'])

await client
  .from('posts')
  .select('*')
  .in('status', ['draft', 'published'])`,
  },
  {
    title: 'Combining Filters',
    description: 'Chain multiple filters together for complex queries',
    code: `// Multiple filters with AND logic
const { data } = await client
  .from('users')
  .select('*')
  .eq('status', 'active')
  .gte('age', 18)
  .order('created_at', { ascending: false })
  .limit(10)

// Filter with OR logic using 'or'
const { data } = await client
  .from('products')
  .select('*')
  .or('category.eq(electronics),price.gt(100)')

// Complex filtering
const { data } = await client
  .from('orders')
  .select('*')
  .eq('user_id', 1)
  .in('status', ['pending', 'processing'])
  .gte('total', 50)
  .order('created_at', { ascending: false })`,
  },
]

export function SdkDatabase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Database Operations</h2>
      <div className="space-y-6 mb-12">
        {databaseExamples.map((example, index) => (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{example.title}</h3>
              <p className="text-slate-600">{example.description}</p>
            </div>
            <div className="p-6">
              <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
