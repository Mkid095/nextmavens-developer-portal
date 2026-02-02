/**
 * GraphQL Documentation - Module - Code Examples Constants
 */

export const ADDITIONAL_EXAMPLES = [
  {
    title: 'Using Fetch',
    code: `const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: \`query GetUser(\$id: Int!) {
      userById(id: \$id) {
        id
        email
        name
      }
    }\`,
    variables: { id: 1 }
  })
});

const { data, errors } = await response.json();`,
  },
  {
    title: 'Introspection Query',
    description: 'Explore the schema using GraphQL introspection:',
    code: `{
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`,
  },
  {
    title: 'Using GraphQL Clients',
    description: 'Use GraphQL clients like Apollo Explorer, Postman, or curl to interactively explore the schema:',
    code: `# Example with curl
curl -X POST https://api.nextmavens.cloud/graphql \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"query":"{ __schema { types { name } } }"}'

# Or use Apollo Explorer: https://explorer.apollographql.com`,
  },
]
