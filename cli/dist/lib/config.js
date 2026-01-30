import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CliConfig {
  auth_token?: string;
  default_project_id?: string;
  api_base_url: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.nextmavens');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: CliConfig = {
  api_base_url: 'http://localhost:3000',
};

export class ConfigManager {
  private configPath: string;
  private configDir: string;

  constructor() {
    this.configDir = CONFIG_DIR;
    this.configPath = CONFIG_FILE;
    this.ensureConfigExists();
  }

  private ensureConfigExists(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    if (!fs.existsSync(this.configPath)) {
      this.writeConfig(DEFAULT_CONFIG);
    }
  }

  public getConfig(): CliConfig {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(data) as CliConfig;
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      return { ...DEFAULT_CONFIG };
    }
  }

  public writeConfig(config: CliConfig): void {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(this.configPath, data, 'utf-8');
  }

  public get(key: keyof CliConfig): any {
    const config = this.getConfig();
    return config[key];
  }

  public set(key: keyof CliConfig, value: any): void {
    const config = this.getConfig();
    (config as any)[key] = value;
    this.writeConfig(config);
  }

  public unset(key: keyof CliConfig): void {
    const config = this.getConfig();
    delete (config as any)[key];
    this.writeConfig(config);
  }

  public clear(): void {
    this.writeConfig(DEFAULT_CONFIG);
  }

  public getAuthToken(): string | undefined {
    return this.get('auth_token');
  }

  public setAuthToken(token: string): void {
    this.set('auth_token', token);
  }

  public clearAuthToken(): void {
    this.unset('auth_token');
  }

  public getApiBaseUrl(): string {
    return this.get('api_base_url');
  }

  public setApiBaseUrl(url: string): void {
    this.set('api_base_url', url);
  }
}

export const config = new ConfigManager();
