/**
 * MCP Docs Page Types
 */

export interface ToolSchema {
  type?: string
  required?: boolean
  description?: string
  enum?: string[]
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, ToolSchema>
  scopes: string[]
}

export interface ToolCategory {
  category: string
  icon: any
  tools: ToolDefinition[]
}
