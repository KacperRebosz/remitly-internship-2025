import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import { DRIZZLE_INSTANCE } from './index';
import * as schema from './schema';

export const DrizzleProvider: FactoryProvider<
  PostgresJsDatabase<typeof schema>
> = {
  provide: DRIZZLE_INSTANCE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL');
    const logger = new Logger('DrizzleProvider');

    if (!connectionString) {
      logger.error('DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL is not configured.');
    }

    try {
      logger.log('Attempting to connect to database...');
      const client = postgres(connectionString, { prepare: false });
      logger.log('Database connection established.');
      return drizzle(client, { schema, logger: false });
    } catch (error) {
      logger.error('Failed to connect to the database', error);
      throw error;
    }
  },
};

export type DrizzleInstance = PostgresJsDatabase<typeof schema>;
