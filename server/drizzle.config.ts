import type { Config } from 'drizzle-kit';

export default {
  schema: './src/config/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/linguaconnect',
  },
} satisfies Config;
