import { config } from './config';

export interface Developer {
  id: string;
  email: string;
  name: string;
  organization?: string;
  created_at?: string;
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
}

export const apiClient = new ApiClient();
