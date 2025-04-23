import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const runMigrate = async () => {
  const logger = new Logger('MigrationScript');
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is not set');
  }

  logger.log('Starting database migration...');

  try {
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, 'migrations'),
    });
    logger.log('Database migration completed successfully.');
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  }
};

runMigrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
