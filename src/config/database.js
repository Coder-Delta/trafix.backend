import pg from 'pg';

const { Pool } = pg;

let pool = null;

export const databaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'trafix_ai',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  connectionString: process.env.DATABASE_URL || null,
};

export const initializeDatabase = async () => {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_HOST) {
    console.warn('[database] PostgreSQL credentials not configured. Database layer is scaffolded but disabled.');
    return { connected: false, pool: null, mode: 'disabled' };
  }

  try {
    pool = new Pool(databaseConfig.connectionString ? { connectionString: databaseConfig.connectionString } : databaseConfig);
    const client = await pool.connect();
    client.release();
    console.log('[database] PostgreSQL connection initialized');
    return { connected: true, pool, mode: 'live' };
  } catch (error) {
    console.warn('[database] PostgreSQL initialization failed. Continuing in scaffold mode.', error.message);
    return { connected: false, pool: null, mode: 'disabled' };
  }
};

export const getDatabasePool = () => pool;

export const closeDatabase = async () => {
  if (!pool) return;
  await pool.end();
  pool = null;
};

export default { initializeDatabase, getDatabasePool, closeDatabase, databaseConfig };
