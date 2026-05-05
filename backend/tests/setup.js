import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Set test environment variables if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/absense_test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';
}
if (!process.env.PORT) {
  process.env.PORT = '3001';
}
