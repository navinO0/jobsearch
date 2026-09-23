import { Pool } from 'pg';

// Global connection pool to reuse across Next.js API requests
const globalForPg = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForPg.pool ??
  new Pool({
    host: process.env.DATABASE_HOST || '10.0.3.3',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'n8n',
    user: process.env.DATABASE_USER || 'UZ2Dd4tp4eVRsS22',
    password: process.env.DATABASE_PASSWORD || 'TnEHkZif6XMZfHpfx7d6jQCmqUjlkQou',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

// Guarantee all queries default to dedicated 'jobs' schema
pool.on('connect', (client) => {
  client.query('SET search_path TO jobs, public');
});

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export default pool;
