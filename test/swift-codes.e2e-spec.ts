import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { DRIZZLE_INSTANCE, schema } from '../src/db';
import { DrizzleInstance } from '../src/db/drizzle.provider';
import { like, eq } from 'drizzle-orm';

import { CreateSwiftCodeDto } from '../src/swift-codes/dto/create-swift-code.dto';
import { CountryCodesResponseDto } from '../src/swift-codes/dto/country-codes-response.dto';
import { BranchDetailResponseDto } from '../src/swift-codes/dto/branch-detail-response.dto';
import { HeadquarterDetailResponseDto } from '../src/swift-codes/dto/headquarter-detail-response.dto';
import { IsHeadquarterMatchingSwiftCodeConstraint } from '../src/swift-codes/dto/create-swift-code.dto';

describe('SwiftCodesController (e2e)', () => {
  let app: INestApplication;
  let db: DrizzleInstance;
  const apiPrefix = '/api/v1/swift-codes';

  const testCodeEndingXXX = 'E2ETESTAXXX';
  const testCodeNotEndingXXX_A = 'E2ETESTAB1A';
  const testCodeNotEndingXXX_B = 'E2ETESTAC2B';
  const unrelatedCode = 'ABCDEFGHIJ1';
  const testCountryIso = 'AL';
  const testCountryName = 'ALBANIA';

  const hqPayload: CreateSwiftCodeDto & { codeType: string } = {
    swiftCode: testCodeEndingXXX,
    bankName: 'UNITED BANK OF ALBANIA SH.A',
    address: '1 HQ St',
    townName: 'TIRANA',
    countryName: testCountryName,
    countryISO2: testCountryIso,
    isHeadquarter: true,
    timeZone: 'UTC',
    codeType: 'BIC11',
  };

  const branchAPayload: CreateSwiftCodeDto & { codeType: string } = {
    swiftCode: testCodeNotEndingXXX_A,
    bankName: 'E2E Branch A Bank',
    address: '2 Branch Rd',
    townName: 'TestCity',
    countryName: testCountryName,
    countryISO2: testCountryIso,
    isHeadquarter: false,
    timeZone: 'UTC',
    codeType: 'BIC11',
  };

  const branchBPayload: CreateSwiftCodeDto & { codeType: string } = {
    swiftCode: testCodeNotEndingXXX_B,
    bankName: 'E2E Branch B Bank',
    address: '3 Branch Ave',
    townName: 'TestCity',
    countryName: testCountryName,
    countryISO2: testCountryIso,
    isHeadquarter: false,
    timeZone: 'UTC',
    codeType: 'BIC11',
  };
  const unrelatedPayload: CreateSwiftCodeDto & { codeType: string } = {
    swiftCode: unrelatedCode,
    bankName: 'Test Bank PL',
    countryName: 'POLAND',
    countryISO2: 'PL',
    isHeadquarter: false,
    address: 'Test Addr',
    townName: 'Test Town',
    timeZone: 'Europe/Warsaw',
    codeType: 'BIC11',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [IsHeadquarterMatchingSwiftCodeConstraint],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => {
          const result = {
            message: 'Validation failed',
            errors: {},
          };

          errors.forEach((error) => {
            const property = error.property;
            if (!result.errors[property]) {
              result.errors[property] = [];
            }

            const constraints = Object.values(error.constraints || {});
            result.errors[property].push(...constraints);
          });

          return new BadRequestException(result);
        },
      }),
    );

    db = moduleFixture.get<DrizzleInstance>(DRIZZLE_INSTANCE);

    await db
      .delete(schema.swiftCodes)
      .where(eq(schema.swiftCodes.countryISO2, testCountryIso)); // "AL"
    await db
      .delete(schema.swiftCodes)
      .where(eq(schema.swiftCodes.countryISO2, 'PL')); // "PL"

    const recordsToInsert = [
      { name: 'HQ', payload: hqPayload },
      { name: 'Branch A', payload: branchAPayload },
      { name: 'Branch B', payload: branchBPayload },
      { name: 'Unrelated', payload: unrelatedPayload },
    ];
    for (const item of recordsToInsert) {
      const record = {
        ...item.payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(schema.swiftCodes).values([record]);
    }
    await app.init();
  });

  afterAll(async () => {
    await db
      .delete(schema.swiftCodes)
      .where(eq(schema.swiftCodes.countryISO2, testCountryIso)); // "AL"
    await db
      .delete(schema.swiftCodes)
      .where(eq(schema.swiftCodes.countryISO2, 'PL')); // "PL"

    await app.close();
  });

  // --- POST Tests ---
  describe(`POST ${apiPrefix}`, () => {
    const newCodePayload: CreateSwiftCodeDto = {
      swiftCode: 'E2ETESTNEW2',
      bankName: 'New Class Bank',
      countryName: 'NEWCLASSIA',
      countryISO2: 'NC',
      isHeadquarter: false,
      address: '5 New Road',
      townName: 'New Class Town',
      timeZone: 'UTC',
      codeType: 'BIC11',
    };

    afterEach(async () => {
      await db
        .delete(schema.swiftCodes)
        .where(eq(schema.swiftCodes.swiftCode, newCodePayload.swiftCode));
    });

    it('should create a new SWIFT code (201)', () => {
      return request(app.getHttpServer())
        .post(apiPrefix)
        .send(newCodePayload)
        .expect(HttpStatus.CREATED)
        .expect({ message: 'SWIFT code added successfully.' });
    });

    it('should fail if the same swiftCode is posted twice (409)', async () => {
      const payload = {
        swiftCode: 'DUPLICATECD',
        bankName: 'Duplicate Test Bank',
        countryName: 'DUPLAND',
        countryISO2: 'DP',
        isHeadquarter: false,
        address: '1 Dupe St',
        townName: 'Dupetown',
        timeZone: 'UTC',
        codeType: 'BIC11',
      };
      const swiftCodeUpper = payload.swiftCode.toUpperCase();

      try {
        await request(app.getHttpServer())
          .post(apiPrefix)
          .send(payload)
          .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
          .post(apiPrefix)
          .send(payload)
          .expect(HttpStatus.CONFLICT)
          .then((res: Response) => {
            expect(res.body.message).toContain(
              `SWIFT code ${swiftCodeUpper} already exists.`,
            );
          });
      } finally {
        await db
          .delete(schema.swiftCodes)
          .where(eq(schema.swiftCodes.swiftCode, swiftCodeUpper));
      }
    });

    it('should fail with validation error (length) (400)', () => {
      const invalidPayload = { ...newCodePayload, swiftCode: 'SHORT' };
      return request(app.getHttpServer())
        .post(apiPrefix)
        .send(invalidPayload)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res: Response) => {
          const body = res.body as {
            message: string;
            errors: Record<string, string[]>;
            statusCode: number;
          };
          expect(body.message).toEqual('Validation failed');
          expect(body.errors.swiftCode).toEqual(
            expect.arrayContaining([
              expect.stringMatching(/SWIFT code must be alphanumeric/),
              expect.stringMatching(/11 characters/),
            ]),
          );
        });
    });

    it('should fail with validation error (isHeadquarter mismatch) (400)', () => {
      const mismatchPayloadHqFalse = {
        ...hqPayload,
        isHeadquarter: false,
      };
      return request(app.getHttpServer())
        .post(apiPrefix)
        .send(mismatchPayloadHqFalse)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res: Response) => {
          const body = res.body as {
            message: string;
            errors: Record<string, string[]>;
            statusCode: number;
          };
          expect(body.message).toEqual('Validation failed');
          expect(body.errors.isHeadquarter).toBeDefined();

          expect(body.errors.isHeadquarter[0]).toMatch(
            /must not end with XXX/i,
          );
        });
    });

    it('should fail with validation error (missing required field - e.g., bankName) (400)', () => {
      const { bankName: _bankName, ...incompletePayload } = newCodePayload;
      return request(app.getHttpServer())
        .post(apiPrefix)
        .send(incompletePayload)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res: Response) => {
          const body = res.body as {
            message: string;
            errors: Record<string, string[]>;
            statusCode: number;
          };
          expect(body.message).toEqual('Validation failed');
          expect(body.errors.bankName).toBeDefined();
        });
    });

    it('should fail with validation error (missing required field - codeType) (400)', () => {
      const { codeType: _codeType, ...incompletePayload } = newCodePayload;
      return request(app.getHttpServer())
        .post(apiPrefix)
        .send(incompletePayload)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res: Response) => {
          const body = res.body as {
            message: string;
            errors: Record<string, string[]>;
            statusCode: number;
          };
          expect(body.message).toEqual('Validation failed');
          expect(body.errors.codeType).toBeDefined();
        });
    });
  });

  describe(`GET ${apiPrefix}/:swiftCode`, () => {
    it('should retrieve headquarter details and branches (200)', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/${testCodeEndingXXX}`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const body = res.body as HeadquarterDetailResponseDto;
          expect(body.swiftCode).toBe(testCodeEndingXXX);
          expect(body.isHeadquarter).toBe(true);
          expect(body.countryName).toBe(testCountryName);
          expect(body.branches).toBeDefined();
          expect(body.branches.length).toBe(2);
          expect(body.branches[0].swiftCode).toMatch(/^E2ETESTA[BC]/);
          expect(body.branches[0]).not.toHaveProperty('countryName');
        });
    });

    it('should retrieve branch details (200)', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/${testCodeNotEndingXXX_A}`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const body = res.body as BranchDetailResponseDto;
          expect(body.swiftCode).toBe(testCodeNotEndingXXX_A);
          expect(body.isHeadquarter).toBe(false);
          expect(body.countryName).toBe(testCountryName);
          expect(body).not.toHaveProperty('branches');
        });
    });

    it('should return 404 for non-existent code', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/NONEXISTCD1`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid swift code format in param', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/INVALID`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe(`GET ${apiPrefix}/country/:countryISO2code`, () => {
    it('should retrieve all codes for a country (200)', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/country/${testCountryIso}`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const body = res.body as CountryCodesResponseDto;
          expect(body.countryISO2).toBe(testCountryIso);
          expect(body.countryName).toBe(testCountryName);
          expect(body.swiftCodes.length).toBe(3);
          expect(body.swiftCodes[0]).not.toHaveProperty('countryName');
        });
    });

    it('should return empty list for country with no codes (200)', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/country/XX`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const body = res.body as CountryCodesResponseDto;
          expect(body.countryISO2).toBe('XX');
          expect(body.countryName).toBe('Unknown');
          expect(body.swiftCodes).toEqual([]);
        });
    });

    it('should return 400 for invalid country code format in param', () => {
      return request(app.getHttpServer())
        .get(`${apiPrefix}/country/INVALID`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // --- DELETE Tests ---
  describe(`DELETE ${apiPrefix}/:swiftCode`, () => {
    const codeToDelete = 'E2ETESTDEL2';
    const deletePayload = {
      swiftCode: codeToDelete,
      bankName: 'Delete Me',
      countryName: 'DELETIA',
      countryISO2: 'DL',
      isHeadquarter: false,
      codeType: 'BIC11',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      await db
        .insert(schema.swiftCodes)
        .values(deletePayload)
        .onConflictDoNothing();
      console.log(`BEFOREEACH (DELETE): Ensured ${codeToDelete} exists.`);
    });
    afterEach(async () => {
      await db
        .delete(schema.swiftCodes)
        .where(eq(schema.swiftCodes.swiftCode, codeToDelete));
      console.log(`AFTEREACH (DELETE): Cleaned up ${codeToDelete}.`);
    });

    it('should delete an existing branch SWIFT code (200)', () => {
      return request(app.getHttpServer())
        .delete(`${apiPrefix}/${codeToDelete}`)
        .expect(HttpStatus.OK)
        .expect({ message: 'SWIFT code deleted successfully.' });
    });

    it('should fail to delete HQ if branches exist (409)', async () => {
      await db
        .insert(schema.swiftCodes)
        .values([
          { ...hqPayload, createdAt: new Date(), updatedAt: new Date() },
          { ...branchAPayload, createdAt: new Date(), updatedAt: new Date() },
          { ...branchBPayload, createdAt: new Date(), updatedAt: new Date() },
        ])
        .onConflictDoNothing();

      return request(app.getHttpServer())
        .delete(`${apiPrefix}/${testCodeEndingXXX}`)
        .expect(HttpStatus.CONFLICT);
    });

    it('should allow deleting HQ after its branches are deleted', async () => {
      await db
        .insert(schema.swiftCodes)
        .values([
          { ...hqPayload, createdAt: new Date(), updatedAt: new Date() },
          { ...branchAPayload, createdAt: new Date(), updatedAt: new Date() },
          { ...branchBPayload, createdAt: new Date(), updatedAt: new Date() },
        ])
        .onConflictDoNothing();

      console.log('Deleting branch A:', testCodeNotEndingXXX_A);
      await request(app.getHttpServer())
        .delete(`${apiPrefix}/${testCodeNotEndingXXX_A}`)
        .expect(HttpStatus.OK);
      console.log('Deleting branch B:', testCodeNotEndingXXX_B);
      await request(app.getHttpServer()).delete(
        `${apiPrefix}/${testCodeNotEndingXXX_B}`,
      );

      console.log('Deleting HQ:', testCodeEndingXXX);
      return request(app.getHttpServer())
        .delete(`${apiPrefix}/${testCodeEndingXXX}`)
        .expect(HttpStatus.OK);
    });

    it('should return 404 when deleting non-existent code', () => {
      return request(app.getHttpServer())
        .delete(`${apiPrefix}/NONEXISTDEL`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid swift code format in param', () => {
      return request(app.getHttpServer())
        .delete(`${apiPrefix}/INVALID`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
