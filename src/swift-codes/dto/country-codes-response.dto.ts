import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SwiftCodeListItemDto } from './swift-code-list-item.dto';

export class CountryCodesResponseDto {
  @ApiProperty({ example: 'DE', description: '2-character country ISO code.' })
  countryISO2: string;

  @ApiProperty({ example: 'GERMANY', description: 'Full name of the country.' })
  countryName: string;

  @ApiProperty({
    type: [SwiftCodeListItemDto],
    description: 'List of SWIFT codes (both HQs and branches) for the country.',
  })
  @Type(() => SwiftCodeListItemDto)
  swiftCodes: SwiftCodeListItemDto[];
}
