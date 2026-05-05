import pg from 'pg';
import { env } from './environment.js';

const { Pool } = pg;

const poolConfig = env.DATABASE.URL
  ? { connectionString: env.DATABASE.URL }
  : {
      host: env.DATABASE.HOST,
      port: env.DATABASE.PORT,
      database: env.DATABASE.NAME,
      user: env.DATABASE.USER,
      password: env.DATABASE.PASSWORD,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  }
}

export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text.substring(0, 50)}...`);
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getConnection() {
  return pool.connect();
}

export async function closeDatabase() {
  await pool.end();
  console.log('✓ Database connection closed');
}
