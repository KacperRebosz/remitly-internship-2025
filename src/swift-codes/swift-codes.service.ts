import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, like, ne, and, sql } from 'drizzle-orm';
import { DrizzleInstance } from '../db/drizzle.provider';
import { DRIZZLE_INSTANCE } from '../db';
import { schema } from '../db';
import { SwiftCode } from '../db/schema';

import { CreateSwiftCodeDto } from './dto/create-swift-code.dto';
import { BranchDetailResponseDto } from './dto/branch-detail-response.dto';
import { HeadquarterDetailResponseDto } from './dto/headquarter-detail-response.dto';
import { CountryCodesResponseDto } from './dto/country-codes-response.dto';
import { SwiftCodeListItemDto } from './dto/swift-code-list-item.dto';

@Injectable()
export class SwiftCodesService {
  private readonly logger = new Logger(SwiftCodesService.name);

  constructor(@Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleInstance) {}

  private formatListItem(code: SwiftCode): SwiftCodeListItemDto {
    const dto = new SwiftCodeListItemDto();
    dto.address = code.address ?? '';
    dto.bankName = code.bankName;
    dto.countryISO2 = code.countryISO2;

    dto.isHeadquarter = !!code.isHeadquarter;
    dto.swiftCode = code.swiftCode;
    return dto;
  }

  async findOne(
    swiftCode: string,
  ): Promise<BranchDetailResponseDto | HeadquarterDetailResponseDto> {
    this.logger.log(`Finding details for SWIFT code: ${swiftCode}`);

    const results = await this.db
      .select()
      .from(schema.swiftCodes)
      .where(eq(schema.swiftCodes.swiftCode, swiftCode))
      .limit(1);

    if (results.length === 0) {
      this.logger.warn(`SWIFT code not found: ${swiftCode}`);
      throw new NotFoundException(`SWIFT code ${swiftCode} not found.`);
    }

    const codeDetails = results[0];
    const baseResponse = this.formatListItem(codeDetails);

    const detailResponse = new BranchDetailResponseDto();
    Object.assign(detailResponse, baseResponse);
    detailResponse.countryName = codeDetails.countryName;

    if (codeDetails.isHeadquarter) {
      this.logger.log(`Code ${swiftCode} is HQ. Finding branches...`);
      const hqPrefix = swiftCode.substring(0, 8);
      const branches = await this.db
        .select()
        .from(schema.swiftCodes)
        .where(
          and(
            like(schema.swiftCodes.swiftCode, `${hqPrefix}%`),
            ne(schema.swiftCodes.swiftCode, swiftCode),
          ),
        );

      const formattedBranches: SwiftCodeListItemDto[] = branches.map((branch) =>
        this.formatListItem(branch),
      );
      this.logger.log(
        `Found ${formattedBranches.length} branches for ${swiftCode}.`,
      );

      const hqResponse = new HeadquarterDetailResponseDto();
      Object.assign(hqResponse, detailResponse);
      hqResponse.branches = formattedBranches;
      return hqResponse;
    } else {
      this.logger.log(`Code ${swiftCode} is a branch.`);
      return detailResponse;
    }
  }

  async findByCountry(countryIso: string): Promise<CountryCodesResponseDto> {
    this.logger.log(`Finding SWIFT codes for country: ${countryIso}`);
    const results = await this.db
      .select()
      .from(schema.swiftCodes)
      .where(eq(schema.swiftCodes.countryISO2, countryIso))
      .orderBy(schema.swiftCodes.isHeadquarter, schema.swiftCodes.swiftCode);

    let countryName = 'Unknown';
    if (results.length > 0) {
      countryName = results[0].countryName;
    } else {
      this.logger.log(`No SWIFT codes found for country ${countryIso}.`);
    }

    const formattedSwiftCodes: SwiftCodeListItemDto[] = results.map((code) =>
      this.formatListItem(code),
    );

    this.logger.log(
      `Found ${formattedSwiftCodes.length} codes for country ${countryIso}.`,
    );

    const responseDto = new CountryCodesResponseDto();
    responseDto.countryISO2 = countryIso;
    responseDto.countryName = countryName;
    responseDto.swiftCodes = formattedSwiftCodes;

    return responseDto;
  }

  async create(createSwiftCodeDto: CreateSwiftCodeDto): Promise<SwiftCode> {
    const swiftCode = createSwiftCodeDto.swiftCode.toUpperCase();

    const existingCodes = await this.db
      .select()
      .from(schema.swiftCodes)
      .where(eq(schema.swiftCodes.swiftCode, swiftCode))
      .limit(1);

    if (existingCodes.length > 0) {
      this.logger.warn(`SWIFT code ${swiftCode} already exists.`);
      throw new ConflictException(`SWIFT code ${swiftCode} already exists.`);
    }

    const now = new Date();
    const newRecord = {
      ...createSwiftCodeDto,
      swiftCode,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await this.db
        .insert(schema.swiftCodes)
        .values(newRecord)
        .returning();
      return result[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(`SWIFT code ${swiftCode} already exists.`);
      }
      this.logger.error(`Error creating SWIFT code: ${error.message}`);
      throw error;
    }
  }

  async remove(swiftCode: string): Promise<void> {
    this.logger.log(`Attempting to delete SWIFT code: ${swiftCode}`);

    const existingCode = await this.db
      .select({
        swiftCode: schema.swiftCodes.swiftCode,
        isHeadquarter: schema.swiftCodes.isHeadquarter,
      })
      .from(schema.swiftCodes)
      .where(eq(schema.swiftCodes.swiftCode, swiftCode))
      .limit(1);

    if (existingCode.length === 0) {
      this.logger.warn(`Delete failed: SWIFT code ${swiftCode} not found.`);
      throw new NotFoundException(`SWIFT code ${swiftCode} not found.`);
    }

    if (existingCode[0].isHeadquarter) {
      this.logger.log(`Code ${swiftCode} is HQ. Checking for branches...`);
      const hqPrefix = swiftCode.substring(0, 8);
      const branchCountResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.swiftCodes)
        .where(
          and(
            like(schema.swiftCodes.swiftCode, `${hqPrefix}%`),
            ne(schema.swiftCodes.swiftCode, swiftCode),
          ),
        );

      const branchCount = Number(branchCountResult[0]?.count ?? 0);
      if (branchCount > 0) {
        this.logger.warn(
          `Cannot delete HQ ${swiftCode}: ${branchCount} branches exist.`,
        );
        throw new ConflictException(
          `Cannot delete headquarter SWIFT code ${swiftCode} while ${branchCount} branches exist.`,
        );
      }
      this.logger.log(
        `No branches found for HQ ${swiftCode}. Proceeding with deletion.`,
      );
    }

    const deleteResult = await this.db
      .delete(schema.swiftCodes)
      .where(eq(schema.swiftCodes.swiftCode, swiftCode))
      .returning({ deletedCode: schema.swiftCodes.swiftCode });

    if (deleteResult.length === 0) {
      this.logger.error(
        `Delete failed unexpectedly after check for SWIFT code: ${swiftCode}`,
      );
      throw new InternalServerErrorException(
        `Could not delete SWIFT code ${swiftCode}.`,
      );
    }

    this.logger.log(`Successfully deleted SWIFT code: ${swiftCode}`);
  }
}
