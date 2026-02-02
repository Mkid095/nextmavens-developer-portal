/**
 * MCP Docs Page Constants
 * Main configuration and exports
 */

export const mcpConfig = {
  gatewayDomain: 'https://api.nextmavens.cloud',
  mcpServerPackage: '@nextmavenspacks/mcp-server',
  installCommand: 'npx -y @nextmavenspacks/mcp-server',
  available: true,
  protocol: 'MCP (Model Context Protocol) 2024-11-05',
  toolsCount: 39,
  version: '1.0.0',
}

export type { ToolSchema, ToolDefinition, ToolCategory } from './types'
export { mcpTools } from './tools'
export { tokenTypes, scopeDescriptions } from './tokens'
export { compatibleAITools } from './ai-tools'
