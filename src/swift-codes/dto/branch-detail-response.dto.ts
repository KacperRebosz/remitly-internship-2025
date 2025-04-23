import { ApiProperty } from '@nestjs/swagger';
import { SwiftCodeListItemDto } from './swift-code-list-item.dto';

export class BranchDetailResponseDto extends SwiftCodeListItemDto {
  @ApiProperty({ example: 'GERMANY', description: 'Full name of the country.' })
  countryName: string;
}
