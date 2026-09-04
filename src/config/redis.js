import { Redis } from '@upstash/redis';

let client = null;

export const redisConfig = {
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
};

export const initializeRedis = async () => {
  if (!redisConfig.upstashUrl || !redisConfig.upstashToken) {
    console.warn('[redis] Upstash credentials not configured. Redis layer is disabled.');
    return { connected: false, client: null, mode: 'disabled' };
  }

  client = new Redis({
    url: redisConfig.upstashUrl,
    token: redisConfig.upstashToken,
  });

  try {
    await client.ping();
    console.log('[redis] Upstash Redis connection initialized');
    return { connected: true, client, mode: 'upstash' };
  } catch (error) {
    client = null;
    console.warn('[redis] Upstash Redis initialization failed. Continuing in scaffold mode.', error.message);
    return { connected: false, client: null, mode: 'disabled' };
  }
};

export const getRedisClient = () => client;

export const closeRedis = async () => {
  client = null;
};

export default { initializeRedis, getRedisClient, closeRedis, redisConfig };
