import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from './env';

// PostgreSQL connection
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('Please set the DATABASE_URL environment variable.');
  console.error('Example: postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('🔌 Connecting to PostgreSQL database...');

const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { schema });

export { schema };

// Test connection
client`SELECT 1`.then(() => {
  console.log('✅ Database connected successfully');
}).catch((err: Error) => {
  console.error('❌ Database connection failed:', err.message);
  console.error('Please check your DATABASE_URL environment variable.');
});
