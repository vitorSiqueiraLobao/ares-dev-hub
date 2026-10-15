import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface IrisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  namespace: string;
  timeout: number;
}

export interface AppConfig {
  port: number;
  host: string;
  workspaceDir: string;
  iris: IrisConfig;
  defaultSqlLimit: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  workspaceDir: process.env.WORKSPACE_DIR || process.cwd(),
  iris: {
    host: process.env.IRIS_HOST || 'localhost',
    port: parseInt(process.env.IRIS_PORT || '23', 10),
    username: process.env.IRIS_USERNAME || '',
    password: process.env.IRIS_PASSWORD || '',
    namespace: process.env.IRIS_NAMESPACE || 'USER',
    timeout: parseInt(process.env.IRIS_TIMEOUT || '5000', 10),
  },
  defaultSqlLimit: parseInt(process.env.DEFAULT_SQL_LIMIT || '50', 10),
};
