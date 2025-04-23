import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SwiftCodesService } from './swift-codes.service';

import { CreateSwiftCodeDto } from './dto/create-swift-code.dto';
import { SwiftCodeParamDto } from './dto/swift-code-param.dto';
import { CountryIsoParamDto } from './dto/country-iso-param.dto';
import { BranchDetailResponseDto } from './dto/branch-detail-response.dto';
import { HeadquarterDetailResponseDto } from './dto/headquarter-detail-response.dto';
import { CountryCodesResponseDto } from './dto/country-codes-response.dto';
import { SwiftCodeListItemDto } from './dto/swift-code-list-item.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

@ApiTags('SWIFT Codes')
@Controller('v1/swift-codes')
@ApiExtraModels(
  BranchDetailResponseDto,
  HeadquarterDetailResponseDto,
  SwiftCodeListItemDto,
)
export class SwiftCodesController {
  private readonly logger = new Logger(SwiftCodesController.name);

  constructor(private readonly swiftCodesService: SwiftCodesService) {}

  @Get('country/:countryISO2code')
  @ApiOperation({ summary: 'Return all SWIFT codes for a specific country' })
  @ApiParam({
    name: 'countryISO2code',
    description: 'The 2-character uppercase Country ISO2 code',
    type: String,
    example: 'PL',
  })
  @ApiOkResponse({
    description: 'List of SWIFT codes for the country.',
    type: CountryCodesResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid Country ISO2 code format.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async getByCountry(
    @Param() params: CountryIsoParamDto,
  ): Promise<CountryCodesResponseDto> {
    this.logger.log(
      `Received request: GET /v1/swift-codes/country/${params.countryISO2code}`,
    );
    return this.swiftCodesService.findByCountry(params.countryISO2code);
  }

  @Get(':swiftCode')
  @ApiOperation({
    summary: 'Retrieve details of a single SWIFT code (HQ or Branch)',
  })
  @ApiParam({
    name: 'swiftCode',
    description: 'The 11-character SWIFT code',
    type: String,
    example: 'AAISALTRXXX',
  })
  @ApiOkResponse({
    description:
      'SWIFT code details found. Structure depends on whether it is a Headquarter or Branch.',

    schema: {
      oneOf: [
        { $ref: getSchemaPath(HeadquarterDetailResponseDto) },
        { $ref: getSchemaPath(BranchDetailResponseDto) },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid SWIFT code format.' })
  @ApiNotFoundResponse({ description: 'SWIFT code not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async findOne(
    @Param() params: SwiftCodeParamDto,
  ): Promise<BranchDetailResponseDto | HeadquarterDetailResponseDto> {
    this.logger.log(
      `Received request: GET /v1/swift-codes/${params.swiftCode}`,
    );

    return await this.swiftCodesService.findOne(params.swiftCode);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adds a new SWIFT code entry' })
  @ApiBody({
    description: 'Data for the new SWIFT code',
    type: CreateSwiftCodeDto,
  })
  @ApiCreatedResponse({
    description: 'SWIFT code added successfully.',
    type: Object,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body (validation error).',
  })
  @ApiConflictResponse({ description: 'SWIFT code already exists.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async create(
    @Body() createSwiftCodeDto: CreateSwiftCodeDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Received request: POST /v1/swift-codes with code ${createSwiftCodeDto.swiftCode}`,
    );

    await this.swiftCodesService.create(createSwiftCodeDto);
    return { message: 'SWIFT code added successfully.' };
  }

  @Delete(':swiftCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deletes a SWIFT code' })
  @ApiParam({
    name: 'swiftCode',
    description: 'The 11-character SWIFT code to delete',
    type: String,
    example: 'TESTBANKBRA',
  })
  @ApiOkResponse({
    description: 'SWIFT code deleted successfully.',
    type: Object,
  })
  @ApiBadRequestResponse({ description: 'Invalid SWIFT code format.' })
  @ApiNotFoundResponse({ description: 'SWIFT code not found.' })
  @ApiConflictResponse({
    description: 'Cannot delete headquarter with existing branches.',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async remove(
    @Param() params: SwiftCodeParamDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Received request: DELETE /v1/swift-codes/${params.swiftCode}`,
    );
    await this.swiftCodesService.remove(params.swiftCode);
    return { message: 'SWIFT code deleted successfully.' };
  }
}
