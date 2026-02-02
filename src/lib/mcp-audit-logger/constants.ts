/**
 * MCP Audit Logger - Constants
 *
 * US-008: Implement MCP Audit Logging
 *
 * Constants used throughout the MCP audit logging functionality.
 */

/**
 * AI tool patterns for detection from user agent
 */
export const AI_TOOL_PATTERNS: Record<string, RegExp> = {
  'Cursor AI': /cursor/i,
  'Claude': /claude/i,
  'Copilot': /copilot/i,
  'ChatGPT': /chatgpt/i,
  'Codeium': /codeium/i,
  'Tabnine': /tabnine/i,
  'Amazon Q': /amazon\s*q/i,
  'CodeWhisperer': /codewhisperer/i,
  'Continue': /continue/i,
  'Replit': /replit/i,
  'Bolt.new': /bolt\.new/i,
  'v0.dev': /v0\.dev/i,
  'Codium': /codium/i,
  'Aider': /aider/i,
  'Sweep': /sweep/i,
  'AutoCode': /autocode/i,
}

/**
 * IDE version patterns
 */
export const IDE_VERSION_PATTERNS = [
  /vscode\/([\d.]+)/i,
  /jetbrains/i,
  /intellij\s+idea/i,
  /pycharm/i,
  /webstorm/i,
  /sublime\s+text/i,
  /vim/i,
  /neovim/i,
  /emacs/i,
] as const

/**
 * Sensitive field names to redact from payloads
 */
export const SENSITIVE_FIELDS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'private_key',
  'secret_key',
] as const

/**
 * Default pagination limit
 */
export const DEFAULT_LIMIT = 100

/**
 * Default pagination offset
 */
export const DEFAULT_OFFSET = 0

/**
 * Large limit for exports
 */
export const EXPORT_LIMIT = 10000

/**
 * Audit log types
 */
export const AUDIT_LOG_TYPES = {
  MCP_TOKEN_ACTION: 'mcp_token_action',
  MCP_AUTH_FAILURE: 'mcp_auth_failure',
} as const

/**
 * Severity levels
 */
export const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const

/**
 * HTTP status code ranges for severity mapping
 */
export const STATUS_CODE_RANGES = {
  CRITICAL_MIN: 500,
  WARNING_MIN: 400,
} as const

/**
 * MCP key prefix patterns
 */
export const MCP_KEY_PREFIXES = {
  READ_ONLY: 'mcp_ro_',
  READ_WRITE: 'mcp_rw_',
  ADMIN: 'mcp_admin_',
} as const

/**
 * API key types
 */
export const API_KEY_TYPES = {
  MCP: 'mcp',
} as const
