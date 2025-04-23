import { ApiProperty } from '@nestjs/swagger';

export class SwiftCodeListItemDto {
  @ApiProperty({
    example: 'Taunusanlage 12',
    description: 'Branch/HQ address.',
  })
  address: string;

  @ApiProperty({
    example: 'Deutsche Bank AG',
    description: 'Name of the bank.',
  })
  bankName: string;

  @ApiProperty({ example: 'DE', description: '2-character country ISO code.' })
  countryISO2: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if this is a headquarters.',
  })
  isHeadquarter: boolean;

  @ApiProperty({
    example: 'DEUTDEFFXXX',
    description: 'The 11-character SWIFT code.',
  })
  swiftCode: string;
}
