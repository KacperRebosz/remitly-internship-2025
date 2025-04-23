import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { swiftCodes, NewSwiftCode } from '../db/schema';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface CsvRow {
  'COUNTRY ISO2 CODE': string;
  'SWIFT CODE': string;
  'CODE TYPE': string;
  NAME: string;
  ADDRESS?: string;
  'TOWN NAME'?: string;
  'COUNTRY NAME': string;
  'TIME ZONE'?: string;
  [key: string]: string | undefined;
}

const seedDatabase = async () => {
  const logger = new Logger('SeedScript');
  logger.log('🟠 Starting database seed...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error('🔴 DATABASE_URL not set.');
    process.exit(1);
  }

  let migrationClient: postgres.Sql | undefined;
  try {
    migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient, { schema: { swiftCodes } });
    logger.log('🔵 DB connection established.');

    const csvFilePath = process.env.CSV_FILE_PATH;
    if (!csvFilePath) {
      logger.error('🔴 CSV_FILE_PATH not set.');
      process.exit(1);
    }
    const absoluteCsvPath = path.resolve(process.cwd(), 'src', csvFilePath);
    logger.log(`🔵 Reading CSV: ${absoluteCsvPath}`);

    if (!fs.existsSync(absoluteCsvPath)) {
      logger.error(`🔴 CSV file not found: ${absoluteCsvPath}`);
      process.exit(1);
    }

    const csvFile = fs.readFileSync(absoluteCsvPath, 'utf8');
    const parsedData = Papa.parse<CsvRow>(csvFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsedData.errors.length > 0) {
      logger.error('🔴 CSV Parsing Error:', parsedData.errors);
      process.exit(1);
    }
    logger.log(`🔵 Parsed ${parsedData.data.length} rows.`);

    const newSwiftCodes: NewSwiftCode[] = [];
    for (const row of parsedData.data) {
      const swiftCodeRaw = row['SWIFT CODE']?.trim();
      const countryIsoRaw = row['COUNTRY ISO2 CODE']?.trim();
      const countryNameRaw = row['COUNTRY NAME']?.trim();
      const bankNameRaw = row['NAME']?.trim();
      const codeTypeRaw = row['CODE TYPE']?.trim();

      if (
        !swiftCodeRaw ||
        swiftCodeRaw.length !== 11 ||
        !/^[A-Za-z0-9]{11}$/.test(swiftCodeRaw)
      ) {
        logger.warn(`⚠️ Skipping invalid SWIFT: ${swiftCodeRaw}`);
        continue;
      }
      if (
        !countryIsoRaw ||
        countryIsoRaw.length !== 2 ||
        !/^[A-Za-z]{2}$/.test(countryIsoRaw)
      ) {
        logger.warn(`⚠️ Skipping invalid ISO2: ${countryIsoRaw}`);
        continue;
      }
      if (!countryNameRaw) {
        logger.warn(`⚠️ Skipping missing Country Name`);
        continue;
      }
      if (!bankNameRaw) {
        logger.warn(`⚠️ Skipping missing Bank Name`);
        continue;
      }
      if (!codeTypeRaw) {
        logger.warn(
          `⚠️ Skipping row due to missing CODE TYPE for SWIFT: ${swiftCodeRaw}`,
        );
        continue;
      }

      const swiftCodeUpper = swiftCodeRaw.toUpperCase();
      const countryIsoUpper = countryIsoRaw.toUpperCase();
      const countryNameUpper = countryNameRaw.toUpperCase();
      const isHeadquarter = swiftCodeUpper.endsWith('XXX');

      newSwiftCodes.push({
        swiftCode: swiftCodeUpper,
        bankName: bankNameRaw,
        address: row['ADDRESS']?.trim() || null,
        townName: row['TOWN NAME']?.trim() || null,
        countryName: countryNameUpper,
        countryISO2: countryIsoUpper,
        isHeadquarter: isHeadquarter,
        codeType: codeTypeRaw,
        timeZone: row['TIME ZONE']?.trim() || null,
      });
    }

    if (newSwiftCodes.length === 0) {
      logger.log('🟡 No valid data to insert.');
      process.exit(0);
    }
    logger.log(`🔵 Prepared ${newSwiftCodes.length} valid codes.`);

    logger.log('🟠 Clearing existing swift_codes table (optional)...');
    await db.delete(swiftCodes);

    logger.log('🟠 Inserting new codes...');
    const batchSize = 500;
    for (let i = 0; i < newSwiftCodes.length; i += batchSize) {
      const batch = newSwiftCodes.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      logger.log(
        `Inserting batch ${batchNum} of ${Math.ceil(newSwiftCodes.length / batchSize)}...`,
      );
      await db.insert(swiftCodes).values(batch);
      logger.log(`Batch ${batchNum} inserted.`);
    }

    logger.log('🟢 Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('🔴 Error during database seed:', error);
    process.exit(1);
  } finally {
    if (migrationClient) {
      await migrationClient.end();
      logger.log('🔵 DB connection closed.');
    }
  }
};

seedDatabase().catch((error) => {
  console.error('Seed failed to run: ', error);
  process.exit(1);
});
