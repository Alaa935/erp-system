import dotenv from 'dotenv';
dotenv.config();

function envRequired(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function envOptional(key: string, def: string): string {
  return process.env[key] || def;
}

function envInt(key: string, def: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : def;
}

export const env = {
  PORT: envInt('PORT', 4000),
  NODE_ENV: envOptional('NODE_ENV', 'development'),
  DATABASE_URL: envRequired('DATABASE_URL'),
  JWT_SECRET: envRequired('JWT_SECRET'),
  JWT_REFRESH_SECRET: envRequired('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN: envOptional('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: envOptional('JWT_REFRESH_EXPIRES_IN', '7d'),
  CORS_ORIGIN: envOptional('CORS_ORIGIN', 'http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: envInt('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: envInt('RATE_LIMIT_MAX_REQUESTS', 100),
  LOGIN_RATE_LIMIT_MAX: envInt('LOGIN_RATE_LIMIT_MAX', 5),
  LOGIN_RATE_LIMIT_WINDOW_MS: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 900000),
  BCRYPT_SALT_ROUNDS: envInt('BCRYPT_SALT_ROUNDS', 12),
};
