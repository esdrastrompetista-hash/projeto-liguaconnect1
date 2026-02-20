import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from './env';

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('🔌 Connecting to PostgreSQL...');

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export { schema };

// Test connection
client`SELECT 1`.then(() => {
  console.log('✅ Database connected');
}).catch((err: Error) => {
  console.error('❌ Database error:', err.message);
});
