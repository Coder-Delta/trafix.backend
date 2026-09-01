import redis from 'redis';

let client = null;

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || undefined,
};

export const initializeRedis = async () => {
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    console.warn('[redis] Redis credentials not configured. Redis layer is scaffolded but disabled.');
    return { connected: false, client: null, mode: 'disabled' };
  }

  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || `redis://${redisConfig.username ? `${redisConfig.username}@` : ''}${redisConfig.host}:${redisConfig.port}`,
      password: redisConfig.password,
    });

    client.on('error', (error) => {
      console.warn('[redis] Redis client error:', error.message);
    });

    await client.connect();
    console.log('[redis] Redis connection initialized');
    return { connected: true, client, mode: 'live' };
  } catch (error) {
    console.warn('[redis] Redis initialization failed. Continuing in scaffold mode.', error.message);
    return { connected: false, client: null, mode: 'disabled' };
  }
};

export const getRedisClient = () => client;

export const closeRedis = async () => {
  if (!client) return;
  await client.quit();
  client = null;
};

export default { initializeRedis, getRedisClient, closeRedis, redisConfig };
