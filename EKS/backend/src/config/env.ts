import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variable schema (ZERO HARDCODE)
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  MAX_FILE_SIZE_MB: z.string().transform(Number).default('10'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Neo4j
  NEO4J_URI: z.string().min(1, 'NEO4J_URI is required'),
  NEO4J_USERNAME: z.string().min(1, 'NEO4J_USERNAME is required'),
  NEO4J_PASSWORD: z.string().min(1, 'NEO4J_PASSWORD is required'),
  NEO4J_DATABASE: z.string().default('neo4j'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Bootstrap Admin (local, no Neo4j)
  BOOTSTRAP_ADMIN_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().default('admin@admin.com.br'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().default('admin123'),
  BOOTSTRAP_ADMIN_ORGANIZATION_TYPE: z
    .enum(['cocreate', 'cvc', 'startup', 'client'])
    .default('cvc'),

  // Agent Server
  AGENT_SERVER_URL: z.string().url().default('http://localhost:8000'),

  // Admin Seed (optional, for development)
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_NAME: z.string().optional(),
  SEED_ADMIN_PASSWORD_HASH: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
