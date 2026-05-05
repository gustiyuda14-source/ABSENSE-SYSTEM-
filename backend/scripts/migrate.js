import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...\n');

    // Read and execute main schema file
    const schemaPath = path.join(__dirname, '../migrations/001_create_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schemaSql.split(';').filter((stmt) => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    }

    console.log('✓ Schema migration completed\n');

    // Read and execute seed file
    const seedPath = path.join(__dirname, '../seeds/employees.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    const seedStatements = seedSql.split(';').filter((stmt) => stmt.trim());

    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message.includes('duplicate')) {
            throw error;
          }
        }
      }
    }

    console.log('✓ Seed data inserted\n');
    console.log('✅ Database ready!\n');
    console.log('Test credentials:');
    console.log('  Username: rangga_pratama');
    console.log('  Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
