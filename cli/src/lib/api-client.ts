import { config } from './config';

export interface Developer {
  id: string;
  email: string;
  name: string;
  organization?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  tenant_id: string;
  webhook_url?: string;
  allowed_origins?: string[];
  rate_limit?: number;
  status: string;
  created_at: string;
}

export interface CreateProjectResponse {
  project: Project;
}

export interface LoginResponse {
  developer: Developer;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface DbPushOptions {
  schema: string;
  schema_file: string;
}

export interface DbPushResponse {
  success: boolean;
  version: string;
  tables_created: number;
  tables_modified: number;
  tables_deleted: number;
  warnings?: string[];
}

export interface DbDiffOptions {
  schema?: string;
}

export interface DbDiffResponse {
  has_changes: boolean;
  tables_created?: string[];
  tables_modified?: any[];
  tables_deleted?: string[];
  columns_created?: any[];
  columns_deleted?: any[];
  summary?: {
    tables_created: number;
    tables_modified: number;
    tables_deleted: number;
    columns_created: number;
    columns_deleted: number;
  };
}

export interface DbResetResponse {
  success: boolean;
  version: string;
  tables_initialized: number;
  warnings?: string[];
}

// Functions types
export interface FunctionDeployOptions {
  function_name?: string;
  source?: string;
}

export interface FunctionDeployResponse {
  success: boolean;
  function_id: string;
  function_name: string;
  url: string;
  status: string;
  version: string;
  deployed_at: string;
}

export interface FunctionInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  url: string;
  version: string;
  created_at: string;
  updated_at: string;
  last_invocation?: string;
  invocation_count?: number;
}

export interface FunctionListResponse {
  success: boolean;
  functions: FunctionInfo[];
  total: number;
}

export interface FunctionLogsOptions {
  limit?: number;
  offset?: number;
  since?: string;
}

export interface FunctionLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

export interface FunctionLogsResponse {
  success: boolean;
  function_name: string;
  logs: FunctionLogEntry[];
  total: number;
}

// Secrets types
export interface SecretInfo {
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SecretsListResponse {
  success: boolean;
  secrets: SecretInfo[];
  total: number;
}

export interface SecretSetResponse {
  success: boolean;
  secret: SecretInfo;
}

export interface SecretDeleteResponse {
  success: boolean;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = config.getApiBaseUrl();
    this.token = config.getAuthToken() || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle 429 Too Many Requests with exponential backoff
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.pow(2, attempt) * 1000;

          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }

          throw new ApiError(
            'Too many requests. Please try again later.',
            429,
            true
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new ApiError(
            data.error || `HTTP ${response.status}`,
            response.status,
            response.status === 429
          );
        }

        return data;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Network errors or JSON parse errors
        if (attempt < maxAttempts - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        throw new ApiError(
          error instanceof Error ? error.message : 'Network error',
          0,
          true
        );
      }
    }

    throw new ApiError('Max retry attempts reached', 0, true);
  }

  public async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/developer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the token
    this.token = response.accessToken;
    config.setAuthToken(response.accessToken);

    return response;
  }

  public async logout(): Promise<void> {
    this.token = null;
    config.clearAuthToken();
  }

  public async whoami(): Promise<Developer> {
    const response = await this.request<{ developer: Developer }>('/api/developer/me');
    return response.developer;
  }

  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  public async createProject(name: string): Promise<Project> {
    const response = await this.request<{ success: boolean; data: Project }>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify({ project_name: name }),
    });
    return response.data;
  }

  public async listProjects(options?: { status?: string; limit?: number; offset?: number }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const response = await this.request<{ success: boolean; data: Project[]; meta?: any }>(
      `/v1/projects${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  }

  public async dbPush(projectId: string, options: DbPushOptions): Promise<DbPushResponse> {
    const response = await this.request<{ success: boolean; data: DbPushResponse }>(
      `/v1/projects/${projectId}/db/push`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return response.data;
  }

  public async dbDiff(projectId: string, options: DbDiffOptions = {}): Promise<DbDiffResponse> {
    const response = await this.request<{ success: boolean; data: DbDiffResponse }>(
      `/v1/projects/${projectId}/db/diff`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return response.data;
  }

  public async dbReset(projectId: string): Promise<DbResetResponse> {
    const response = await this.request<{ success: boolean; data: DbResetResponse }>(
      `/v1/projects/${projectId}/db/reset`,
      {
        method: 'POST',
      }
    );
    return response.data;
  }

  // Functions API methods
  public async deployFunction(projectId: string, options: FunctionDeployOptions = {}): Promise<FunctionDeployResponse> {
    const response = await this.request<{ success: boolean; data: FunctionDeployResponse }>(
      `/v1/projects/${projectId}/functions/deploy`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return response.data;
  }

  public async listFunctions(projectId: string): Promise<FunctionInfo[]> {
    const response = await this.request<{ success: boolean; data: FunctionInfo[]; meta: { total: number } }>(
      `/v1/projects/${projectId}/functions`
    );
    return response.data;
  }

  public async getFunctionLogs(projectId: string, functionName: string, options: FunctionLogsOptions = {}): Promise<FunctionLogsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.since) params.append('since', options.since);

    const queryString = params.toString();
    const response = await this.request<{ success: boolean; data: FunctionLogsResponse }>(
      `/v1/projects/${projectId}/functions/${functionName}/logs${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  }

  // Secrets API methods
  public async setSecret(projectId: string, key: string, value: string): Promise<SecretSetResponse> {
    const response = await this.request<{ success: boolean; data: SecretSetResponse }>(
      `/v1/projects/${projectId}/secrets`,
      {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      }
    );
    return response.data;
  }

  public async listSecrets(projectId: string): Promise<SecretInfo[]> {
    const response = await this.request<{ success: boolean; data: SecretInfo[]; meta: { total: number } }>(
      `/v1/projects/${projectId}/secrets`
    );
    return response.data;
  }

  public async deleteSecret(projectId: string, key: string): Promise<SecretDeleteResponse> {
    const response = await this.request<{ success: boolean; data: SecretDeleteResponse }>(
      `/v1/projects/${projectId}/secrets/${key}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
