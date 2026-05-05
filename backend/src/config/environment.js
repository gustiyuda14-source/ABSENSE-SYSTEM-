import 'dotenv/config.js';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // Database
  DATABASE: {
    URL: process.env.DATABASE_URL,
    HOST: process.env.DATABASE_HOST || 'localhost',
    PORT: process.env.DATABASE_PORT || 5432,
    NAME: process.env.DATABASE_NAME || 'ajiks_db',
    USER: process.env.DATABASE_USER || 'postgres',
    PASSWORD: process.env.DATABASE_PASSWORD || '',
  },

  // Redis
  REDIS: {
    URL: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_prod',
    EXPIRATION: process.env.JWT_EXPIRATION || '24h',
    REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  // Security
  SECURITY: {
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },

  // URLs
  API_URL: process.env.API_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // GPS
  GEOFENCE_RADIUS: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS || '100'),

  // Timezone
  TIMEZONE: process.env.TIMEZONE || 'Asia/Jakarta',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
